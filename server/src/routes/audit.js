import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';
import * as auditService from '../services/auditService.js';

// Mounted at /api/audit-logs (FR14)
const router = express.Router();
router.use(requireAuth);

router.get('/me', asyncHandler(async (req, res) => {
  res.json(await auditService.getUserAuditLogs(req.user._id, 100));
}));

router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const { user, action, status, startDate, endDate, limit } = req.query;
  res.json(await auditService.getAuditLogs({ user, action, status, startDate, endDate, limit }));
}));

export default router;
