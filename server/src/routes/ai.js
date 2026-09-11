import express from 'express';
import rateLimit from 'express-rate-limit';
import ResponseModel from '../models/response.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import aiService from '../services/aiService.js';

// Mounted at /api/ai
const router = express.Router();

// AI calls cost money: limit each user to a reasonable rate
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: config.isTest ? 10000 : 30,
  keyGenerator: (req) => req.userId,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Please wait a minute and try again.' }
});

router.use(requireAuth, aiLimiter);

function requireText(value, field, maxLength) {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `${field} is required`);
  if (value.length > maxLength) throw new HttpError(400, `${field} must be at most ${maxLength} characters`);
  return value.trim();
}

router.post('/explain', asyncHandler(async (req, res) => {
  const concept = requireText(req.body?.concept, 'Concept', 500);
  const explanation = await aiService.explainConcept(concept, req.body?.level || 'intermediate');
  res.json({ explanation });
}));

router.post('/generate-question', asyncHandler(async (req, res) => {
  const topic = requireText(req.body?.topic, 'Topic', 200);
  const { difficulty, skillType } = req.body;
  const question = await aiService.generateQuestion(topic, difficulty || 'intermediate', skillType || 'vocabulary');
  res.json({ ...question, content: question.text });
}));

router.get('/analyze-progress', asyncHandler(async (req, res) => {
  const responses = await ResponseModel.find({ user: req.user._id }).select('correct').lean();
  const analysis = await aiService.analyzeLearningPattern(responses, req.user.theta);
  res.json({
    analysis,
    stats: {
      totalQuestions: responses.length,
      correctCount: responses.filter((r) => r.correct).length,
      currentLevel: req.user.theta ?? 0
    }
  });
}));

router.post('/conversation', asyncHandler(async (req, res) => {
  const topic = requireText(req.body?.topic, 'Topic', 200);
  res.json({ conversation: await aiService.generateConversation(topic, req.body?.level || 'intermediate') });
}));

router.post('/correct-writing', asyncHandler(async (req, res) => {
  const text = requireText(req.body?.text, 'Text', 5000);
  res.json({ correction: await aiService.correctWriting(text, req.body?.focusArea || 'general') });
}));

export default router;
