import express from 'express';
import ModuleModel from '../models/module.js';
import QuestionModel from '../models/question.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { asyncHandler, assertObjectId, HttpError } from '../middleware/errors.js';
import { thetaToLevel } from '../services/adaptiveEngine.js';
import * as pathGenerationService from '../services/pathGenerationService.js';

const router = express.Router();

const MODULE_FIELDS = [
  'title', 'skill', 'level', 'description', 'difficulty', 'estimatedTime',
  'prerequisites', 'learningObjectives', 'items', 'exercises'
];
const withId = (doc) => ({ ...doc, id: doc._id.toString() });
const summarize = (text) => (text.length > 50 ? `${text.slice(0, 50)}...` : text);

// Personalized learning path: modules within one level of the user's ability
router.get('/learning-path', requireAuth, asyncHandler(async (req, res) => {
  const theta = Number.isFinite(req.user.theta) ? req.user.theta : 0;
  const targetLevel = thetaToLevel(theta);

  const modules = await ModuleModel.find()
    .select('title skill level description difficulty estimatedTime learningObjectives')
    .lean();
  const distance = (m) => Math.abs((m.level ?? 0) - targetLevel);
  const nearby = modules.filter((m) => distance(m) <= 1);
  const selected = (nearby.length ? nearby : modules).sort((a, b) => distance(a) - distance(b));

  res.json({ modules: selected.map(withId), suggestedLevel: targetLevel, theta });
}));

router.get('/modules', requireAuth, asyncHandler(async (req, res) => {
  const modules = await ModuleModel.find()
    .select('title skill level description')
    .sort({ skill: 1, level: 1 })
    .lean();
  res.json(modules.map(withId));
}));

// Module with its questions (answer keys are never sent to the client)
router.get('/module/:id', requireAuth, asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'module id');
  res.set('Cache-Control', 'no-store');

  const module = await ModuleModel.findById(req.params.id).lean();
  if (!module) throw new HttpError(404, 'Module not found');

  const useExercises = module.exercises?.length > 0;
  const questionIds = useExercises
    ? module.exercises
    : (module.items || []).map((item) => item.questionId).filter(Boolean);

  const questions = await QuestionModel.find({ _id: { $in: questionIds } })
    .select('-answer -explanation')
    .lean();
  const byId = new Map(questions.map((q) => [q._id.toString(), q]));

  const items = useExercises
    ? module.exercises.map((exerciseId, index) => {
      const question = byId.get(exerciseId.toString()) || null;
      return {
        id: exerciseId.toString(),
        title: question?.text ? summarize(question.text) : `Exercise ${index + 1}`,
        type: question?.type || 'objective',
        difficulty: question?.difficulty ?? 0,
        question
      };
    })
    : (module.items || []).map((item, index) => ({
      ...item,
      id: item.questionId?.toString() || `item-${index}`,
      question: item.questionId ? byId.get(item.questionId.toString()) || null : null
    }));

  res.json({ ...withId(module), items: items.filter((item) => item.question) });
}));

router.post('/module', requireAuth, requireStaff, asyncHandler(async (req, res) => {
  const data = Object.fromEntries(
    MODULE_FIELDS.filter((field) => req.body?.[field] !== undefined).map((field) => [field, req.body[field]])
  );
  const created = await ModuleModel.create(data);
  res.status(201).json(withId(created.toObject()));
}));

// ===== Path generation =====

router.post('/path/generate', requireAuth, asyncHandler(async (req, res) => {
  const { externalScores, targetSkills } = req.body || {};
  res.json(await pathGenerationService.generateInitialPath(req.userId, {
    externalScores,
    targetSkills,
    includeOnboarding: true
  }));
}));

router.get('/path/needs-generation', requireAuth, asyncHandler(async (req, res) => {
  res.json({ needsGeneration: await pathGenerationService.needsInitialPath(req.userId) });
}));

router.post('/path/regenerate', requireAuth, asyncHandler(async (req, res) => {
  res.json(await pathGenerationService.regeneratePath(req.userId));
}));

export default router;
