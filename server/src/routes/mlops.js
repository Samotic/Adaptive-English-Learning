import express from 'express';
import ModelVersionModel from '../models/modelVersion.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, assertObjectId, HttpError } from '../middleware/errors.js';
import retrainingService from '../services/retrainingService.js';

// Mounted at /api/mlops (UC18: retrain/update AI models). Admin only.
const router = express.Router();
router.use(requireAuth, requireAdmin);

router.post('/retrain', asyncHandler(async (req, res) => {
  const { limit, autoDeploy, since } = req.body || {};
  const sinceDate = since ? new Date(since) : null;
  if (sinceDate && Number.isNaN(sinceDate.getTime())) throw new HttpError(400, 'since must be a valid date');

  const result = await retrainingService.retrainModel({
    limit: Math.min(Math.max(parseInt(limit, 10) || 10000, 1), 100000),
    autoDeploy: autoDeploy !== false,
    since: sinceDate
  });
  res.status(result.success ? 200 : 422).json(result.success ? result : { success: false, message: result.message });
}));

router.get('/status', (req, res) => {
  res.json(retrainingService.getStatus());
});

router.get('/versions', asyncHandler(async (req, res) => {
  const versions = await ModelVersionModel.find()
    .select('-questionAdjustments')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ versions });
}));

router.get('/production', asyncHandler(async (req, res) => {
  const model = await ModelVersionModel.getCurrentProductionModel();
  if (!model) throw new HttpError(404, 'No production model found');
  res.json({ model });
}));

router.post('/deploy/:versionId', asyncHandler(async (req, res) => {
  const deployed = await retrainingService.deployModel(req.params.versionId);
  res.json({ success: true, ...deployed });
}));

router.get('/versions/:versionId', asyncHandler(async (req, res) => {
  assertObjectId(req.params.versionId, 'version id');
  const version = await ModelVersionModel.findById(req.params.versionId).lean();
  if (!version) throw new HttpError(404, 'Version not found');
  res.json({ version });
}));

export default router;
