import express from 'express';
import { requireAuth, requireAdmin, canAccessUser } from '../middleware/auth.js';
import { asyncHandler, assertObjectId, HttpError } from '../middleware/errors.js';
import gamificationService from '../services/gamificationService.js';

// Mounted at /api/gamification (FR3: badges and points)
const router = express.Router();
router.use(requireAuth);

router.get('/leaderboard', asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  res.json(await gamificationService.getLeaderboard(limit));
}));

router.post('/init-badges', requireAdmin, asyncHandler(async (req, res) => {
  await gamificationService.initializeDefaultBadges();
  res.json({ success: true, message: 'Default badges initialized' });
}));

router.get('/user/:userId', asyncHandler(async (req, res) => {
  assertObjectId(req.params.userId, 'user id');
  if (!canAccessUser(req, req.params.userId)) throw new HttpError(403, 'You can only view your own badges');
  res.json(await gamificationService.getUserGamification(req.params.userId));
}));

router.post('/check-badges/:userId', asyncHandler(async (req, res) => {
  if (req.params.userId !== req.userId) throw new HttpError(403, 'You can only check your own badges');
  const newBadges = await gamificationService.checkAndAwardBadges(req.userId);
  res.json({
    success: true,
    newBadges,
    message: newBadges.length > 0
      ? `Congratulations! You earned ${newBadges.length} new badge(s)!`
      : 'No new badges earned'
  });
}));

export default router;
