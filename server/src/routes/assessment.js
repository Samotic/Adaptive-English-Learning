import express from 'express';
import mongoose from 'mongoose';
import QuestionModel from '../models/question.js';
import ResponseModel from '../models/response.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { recordAnswer, listPendingReviews, reviewResponse } from '../services/answerRecordingService.js';
import { GradingService, evaluateFreeTextResponse, FREE_TEXT_PASS_GRADE } from '../services/assessmentService.js';

const router = express.Router();
const MAX_SYNC_ENTRIES = 100;

// Next adaptive question: due for review and closest in difficulty to the user's ability
router.get('/next-question', requireAuth, asyncHandler(async (req, res) => {
  const notDue = await ResponseModel.aggregate([
    { $match: { user: req.user._id } },
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$question', nextReview: { $first: '$nextReview' } } },
    { $match: { nextReview: { $gt: new Date() } } }
  ]);

  const theta = Number.isFinite(req.user.theta) ? req.user.theta : 0;
  const [question] = await QuestionModel.aggregate([
    { $match: { _id: { $nin: notDue.map((r) => r._id) } } },
    { $addFields: { _distance: { $abs: { $subtract: [{ $ifNull: ['$difficulty', 0] }, theta] } } } },
    { $sort: { _distance: 1 } },
    { $limit: 1 },
    { $project: { answer: 0, explanation: 0, _distance: 0 } }
  ]);

  if (!question) return res.json({ message: 'All caught up! Take a break' });
  res.json(question);
}));

// Submit an answer (objective or free-text). Correctness is decided on the server.
router.post('/submit', requireAuth, asyncHandler(async (req, res) => {
  const { questionId, userAnswer, isNLP, responseTime } = req.body || {};
  const result = await recordAnswer({
    user: req.user,
    questionId,
    userAnswer,
    mode: isNLP ? 'free-text' : undefined,
    responseTime: Number.isFinite(responseTime) ? responseTime : undefined
  });
  res.json(result);
}));

// Speaking module (FR22): grade a speech transcript
router.post('/evaluate-speech', requireAuth, asyncHandler(async (req, res) => {
  const { questionId, transcript } = req.body || {};
  if (typeof transcript !== 'string' || !transcript.trim()) {
    throw new HttpError(400, 'No speech transcript provided');
  }
  res.json(await recordAnswer({ user: req.user, questionId, userAnswer: transcript, mode: 'speech' }));
}));

// Preview grading of free text without recording an answer
router.post('/evaluate-response', requireAuth, asyncHandler(async (req, res) => {
  const { text, questionId } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) throw new HttpError(400, 'Text is required for evaluation');

  const question = mongoose.isValidObjectId(questionId) ? await QuestionModel.findById(questionId).lean() : null;
  const evaluation = question
    ? evaluateFreeTextResponse(question, text)
    : GradingService.evaluateResponse(text.slice(0, 10000), { promptId: 'free-text-evaluation', studentId: req.userId });

  res.json({
    evaluation,
    passed: evaluation.status === 'graded' && evaluation.grade >= FREE_TEXT_PASS_GRADE,
    needsReview: evaluation.status === 'pending_manual_review'
  });
}));

// Offline progress sync (FR18): answers captured while offline are graded and recorded now
router.post('/progress/sync', requireAuth, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const entries = Array.isArray(body.entries) ? body.entries : [body];
  if (entries.length === 0 || entries.length > MAX_SYNC_ENTRIES) {
    throw new HttpError(400, `Send between 1 and ${MAX_SYNC_ENTRIES} entries`);
  }

  const results = [];
  for (const [index, entry] of entries.entries()) {
    try {
      const result = await recordAnswer({
        user: req.user,
        questionId: entry?.questionId,
        userAnswer: entry?.userAnswer,
        mode: entry?.mode,
        answeredAt: entry?.answeredAt,
        offline: true
      });
      results.push({ index, success: true, correct: result.correct, responseId: result.responseId });
    } catch (err) {
      if (!(err instanceof HttpError)) throw err;
      results.push({ index, success: false, error: err.message });
    }
  }

  res.json({
    success: results.every((r) => r.success),
    synced: results.filter((r) => r.success).length,
    results
  });
}));

// Teacher review of low-confidence automated grades (FR7 workaround)
router.get('/reviews/pending', requireAuth, requireStaff, asyncHandler(async (req, res) => {
  res.json({ reviews: await listPendingReviews() });
}));

router.post('/reviews/:responseId', requireAuth, requireStaff, asyncHandler(async (req, res) => {
  const { correct, grade, feedback } = req.body || {};
  const numericGrade = grade === undefined || grade === null || grade === '' ? undefined : Number(grade);
  res.json(await reviewResponse({
    responseId: req.params.responseId,
    reviewer: req.user,
    correct,
    grade: numericGrade,
    feedback
  }));
}));

export default router;
