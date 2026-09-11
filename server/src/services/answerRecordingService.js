/**
 * Single code path for grading and recording an answer, used by /api/submit, /api/evaluate-speech
 * and offline progress sync. Correctness is always decided on the server.
 */
import mongoose from 'mongoose';
import QuestionModel from '../models/question.js';
import ResponseModel from '../models/response.js';
import UserModel from '../models/user.js';
import { config } from '../config.js';
import { HttpError } from '../middleware/errors.js';
import { updateTheta, nextReviewDate } from './adaptiveEngine.js';
import {
  NLPService,
  checkObjectiveAnswer,
  evaluateFreeTextResponse,
  isFreeTextQuestion,
  isOpenEndedQuestion,
  FREE_TEXT_PASS_GRADE
} from './assessmentService.js';
import gamificationService from './gamificationService.js';
import aiService from './aiService.js';
import * as dataCollectionService from './dataCollectionService.js';
import * as notificationService from './notificationService.js';

export const SPEECH_PASS_GRADE = 60;
const MAX_ANSWER_LENGTH = 10000;

/** Question as sent to students: the answer key stays on the server. */
export function toPublicQuestion(question) {
  if (!question) return question;
  const { answer, explanation, ...rest } = question;
  return rest;
}

function resolveMode(question, requestedMode) {
  if (requestedMode === 'speech') return 'speech';
  if (requestedMode === 'free-text' || isFreeTextQuestion(question)) return 'free-text';
  return 'objective';
}

function resolveAnsweredAt(answeredAt) {
  const now = new Date();
  const date = answeredAt ? new Date(answeredAt) : now;
  return Number.isNaN(date.getTime()) || date > now ? now : date;
}

async function safely(label, fn, fallback) {
  try {
    return await fn();
  } catch (err) {
    console.error(`[Answer] ${label} failed:`, err.message);
    return fallback;
  }
}

export async function recordAnswer({ user, questionId, userAnswer, mode, answeredAt, responseTime, offline = false }) {
  if (!mongoose.isValidObjectId(questionId)) throw new HttpError(400, 'Invalid questionId');
  const question = await QuestionModel.findById(questionId).lean();
  if (!question) throw new HttpError(404, 'Question not found');

  const answer = String(userAnswer ?? '').trim().slice(0, MAX_ANSWER_LENGTH);
  if (!answer) throw new HttpError(400, 'An answer is required');

  const responseMode = resolveMode(question, mode);
  const timestamp = resolveAnsweredAt(answeredAt);
  const result = { responseMode };
  let correct;
  let reviewStatus = 'auto';
  const grading = {};

  if (responseMode === 'speech') {
    const evaluation = NLPService.analyzeSpeech(answer);
    correct = evaluation.grade >= SPEECH_PASS_GRADE;
    Object.assign(grading, {
      nlpGrade: evaluation.grade,
      nlpConfidence: evaluation.confidence,
      isSpeech: true,
      speechMetrics: {
        fluency: evaluation.fluency,
        vocabulary: evaluation.vocabulary,
        coherence: evaluation.coherence,
        wordCount: evaluation.wordCount,
        sentenceCount: evaluation.sentenceCount
      }
    });
    result.speechEvaluation = evaluation;
    result.feedback = evaluation.feedback;
  } else if (responseMode === 'free-text') {
    const evaluation = evaluateFreeTextResponse(question, answer);
    const pending = evaluation.status === 'pending_manual_review';
    correct = !pending && evaluation.grade >= FREE_TEXT_PASS_GRADE;
    reviewStatus = pending ? 'pending_review' : 'auto';
    Object.assign(grading, {
      nlpGrade: evaluation.grade ?? evaluation.provisionalGrade,
      nlpConfidence: evaluation.confidence
    });
    result.nlpEvaluation = evaluation;
    result.feedback = evaluation.feedback;
  } else {
    correct = checkObjectiveAnswer(question, answer);
  }

  const last = await ResponseModel.findOne({ user: user._id, question: question._id })
    .sort({ timestamp: -1 })
    .lean();

  const response = await ResponseModel.create({
    user: user._id,
    question: question._id,
    correct,
    timestamp,
    nextReview: nextReviewDate(last, correct, timestamp),
    userAnswer: answer,
    responseMode,
    reviewStatus,
    syncedFromOffline: offline,
    ...grading
  });

  // Answers waiting for teacher review do not move the ability estimate until reviewed
  let newTheta = Number.isFinite(user.theta) ? user.theta : 0;
  if (reviewStatus !== 'pending_review') {
    newTheta = updateTheta(newTheta, question.difficulty, correct);
  }
  await UserModel.updateOne({ _id: user._id }, { $set: { theta: newTheta, lastActiveAt: new Date() } });
  user.theta = newTheta; // keep the in-memory user current when several answers are synced in one request

  const newBadges = await safely('Badge check', () => gamificationService.checkAndAwardBadges(user._id), []);
  await safely('Training data', () => dataCollectionService.recordQuizAnswer(
    user._id, question._id, correct, responseTime, { question }
  ));

  let aiFeedback = null;
  if (responseMode !== 'speech' && reviewStatus !== 'pending_review' && config.gemini.enableFeedback && !aiService.disabled) {
    aiFeedback = await safely('AI feedback', () => aiService.generateFeedback(question.text, answer, question.answer, correct), null);
  }

  return {
    ...result,
    responseId: response._id.toString(),
    correct,
    reviewStatus,
    newTheta,
    nextReview: response.nextReview,
    correctAnswer: isOpenEndedQuestion(question) ? null : question.answer,
    explanation: question.explanation || null,
    aiFeedback,
    newBadges
  };
}

export async function listPendingReviews(limit = 100) {
  const responses = await ResponseModel.find({ reviewStatus: 'pending_review' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate('user', 'username firstName lastName')
    .populate('question', 'text answer skill type')
    .lean();

  return responses.map((r) => ({
    id: r._id.toString(),
    student: r.user ? { id: r.user._id.toString(), username: r.user.username, firstName: r.user.firstName, lastName: r.user.lastName } : null,
    question: r.question ? { id: r.question._id.toString(), text: r.question.text, answer: r.question.answer, skill: r.question.skill, type: r.question.type } : null,
    userAnswer: r.userAnswer,
    provisionalGrade: r.nlpGrade,
    confidence: r.nlpConfidence,
    submittedAt: r.timestamp
  }));
}

export async function reviewResponse({ responseId, reviewer, correct, grade, feedback }) {
  if (!mongoose.isValidObjectId(responseId)) throw new HttpError(400, 'Invalid response id');
  if (typeof correct !== 'boolean') throw new HttpError(400, '"correct" must be true or false');

  const response = await ResponseModel.findById(responseId).populate('question', 'text difficulty');
  if (!response) throw new HttpError(404, 'Response not found');
  if (response.reviewStatus !== 'pending_review') throw new HttpError(409, 'This response has already been reviewed');

  response.correct = correct;
  if (Number.isFinite(grade)) response.nlpGrade = Math.min(100, Math.max(0, Math.round(grade)));
  response.reviewStatus = 'reviewed';
  response.reviewedBy = reviewer._id;
  response.reviewedAt = new Date();
  response.teacherFeedback = typeof feedback === 'string' ? feedback.trim().slice(0, 2000) : undefined;
  await response.save();

  const student = await UserModel.findById(response.user).select('theta').lean();
  if (student) {
    const theta = updateTheta(student.theta, response.question?.difficulty, correct);
    await UserModel.updateOne({ _id: student._id }, { $set: { theta } });
    await safely('Badge check', () => gamificationService.checkAndAwardBadges(student._id), []);
    await notificationService.sendNotification(
      student._id,
      'review',
      'Your answer was reviewed',
      `${correct ? 'Marked correct' : 'Marked incorrect'}${response.teacherFeedback ? `: ${response.teacherFeedback}` : ''}`
    );
  }

  return {
    id: response._id.toString(),
    correct: response.correct,
    grade: response.nlpGrade,
    reviewStatus: response.reviewStatus,
    teacherFeedback: response.teacherFeedback
  };
}
