import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';
import * as dataCollectionService from '../services/dataCollectionService.js';

// Mounted at /api/training-data (UC18). Recording only happens for users who consented.
const router = express.Router();
router.use(requireAuth);

const toNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : undefined);

router.post('/record', asyncHandler(async (req, res) => {
  res.json(await dataCollectionService.recordInteraction({ ...(req.body || {}), userId: req.userId }));
}));

router.post('/quiz-answer', asyncHandler(async (req, res) => {
  const { questionId, answerCorrect, responseTime, additionalData } = req.body || {};
  res.json(await dataCollectionService.recordQuizAnswer(
    req.userId, questionId, Boolean(answerCorrect), toNumber(responseTime), additionalData || {}
  ));
}));

router.post('/click', asyncHandler(async (req, res) => {
  const { elementClicked, pageUrl, timeSpent } = req.body || {};
  res.json(await dataCollectionService.recordClick(req.userId, elementClicked, pageUrl, toNumber(timeSpent)));
}));

router.post('/page-view', asyncHandler(async (req, res) => {
  const { pageUrl, previousPage, timeSpent } = req.body || {};
  res.json(await dataCollectionService.recordPageView(req.userId, pageUrl, previousPage, toNumber(timeSpent)));
}));

router.post('/module-start', asyncHandler(async (req, res) => {
  const { moduleId, moduleLevel, moduleSkill } = req.body || {};
  res.json(await dataCollectionService.recordModuleStart(req.userId, moduleId, toNumber(moduleLevel), moduleSkill));
}));

router.post('/module-complete', asyncHandler(async (req, res) => {
  const { moduleId, moduleLevel, moduleSkill, timeSpent } = req.body || {};
  res.json(await dataCollectionService.recordModuleComplete(
    req.userId, moduleId, toNumber(moduleLevel), moduleSkill, toNumber(timeSpent)
  ));
}));

router.post('/session', asyncHandler(async (req, res) => {
  const { type, sessionDuration } = req.body || {};
  res.json(await dataCollectionService.recordSession(req.userId, type, toNumber(sessionDuration)));
}));

// ===== Admin =====

router.get('/export', requireAdmin, asyncHandler(async (req, res) => {
  const { startDate, endDate, interactionType, limit, skip } = req.query;
  const data = await dataCollectionService.getTrainingData({ startDate, endDate, interactionType, limit, skip });
  res.json({ success: true, count: data.length, data });
}));

router.get('/stats', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await dataCollectionService.getTrainingDataStats());
}));

router.get('/batch/:batchNumber', requireAdmin, asyncHandler(async (req, res) => {
  const batchNumber = Math.max(parseInt(req.params.batchNumber, 10) || 0, 0);
  const batchSize = Math.min(Math.max(parseInt(req.query.batchSize, 10) || 10000, 1), 10000);
  res.json(await dataCollectionService.exportTrainingDataBatch(batchSize, batchNumber));
}));

export default router;
