import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import * as notificationService from '../services/notificationService.js';

// Mounted at /api/notifications. Static paths are declared before "/:notificationId/read".
const router = express.Router();
router.use(requireAuth);

const listAll = asyncHandler(async (req, res) => {
  res.json({ notifications: await notificationService.getAllNotifications(req.userId) });
});
router.get('/', listAll);
router.get('/all', listAll);

router.get('/unread', asyncHandler(async (req, res) => {
  const notifications = await notificationService.getUnreadNotifications(req.userId);
  res.json({ count: notifications.length, notifications });
}));

// UC16: notification preferences
router.get('/preferences', asyncHandler(async (req, res) => {
  res.json(await notificationService.getUserPreferences(req.userId));
}));

const savePreferences = asyncHandler(async (req, res) => {
  const preferences = await notificationService.updateUserPreferences(req.userId, req.body || {});
  res.json({ success: true, preferences });
});
router.put('/preferences', savePreferences);
router.post('/preferences', savePreferences);

router.post('/mark-all-read', asyncHandler(async (req, res) => {
  const markedCount = await notificationService.markAllAsRead(req.userId);
  res.json({ success: true, markedCount });
}));

router.post('/:notificationId/read', asyncHandler(async (req, res) => {
  const success = await notificationService.markAsRead(req.userId, req.params.notificationId);
  if (!success) throw new HttpError(404, 'Notification not found');
  res.json({ success });
}));

export default router;
