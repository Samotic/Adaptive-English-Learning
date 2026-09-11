import express from 'express';
import UserModel from '../models/user.js';
import { requireAuth, requireStaff, canAccessUser } from '../middleware/auth.js';
import { asyncHandler, assertObjectId, HttpError } from '../middleware/errors.js';
import * as analyticsService from '../services/analyticsService.js';

const router = express.Router();
router.use(requireAuth);

async function authorizeUser(req) {
  const { userId } = req.params;
  assertObjectId(userId, 'user id');
  if (!canAccessUser(req, userId)) throw new HttpError(403, 'You can only view your own analytics');
  if (!(await UserModel.exists({ _id: userId }))) throw new HttpError(404, 'User not found');
}

router.get('/user/:userId', asyncHandler(async (req, res) => {
  await authorizeUser(req);
  res.json(await analyticsService.getUserMetrics(req.params.userId));
}));

router.get('/progress/:userId', asyncHandler(async (req, res) => {
  await authorizeUser(req);
  res.json(await analyticsService.getProgressReport(req.params.userId));
}));

router.get('/class/:classId', requireStaff, asyncHandler(async (req, res) => {
  res.json(await analyticsService.getClassMetrics(String(req.params.classId).slice(0, 50)));
}));

export default router;
