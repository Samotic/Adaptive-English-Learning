import express from 'express';
import UserModel from '../models/user.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import gdprService from '../services/gdprService.js';
import * as auditService from '../services/auditService.js';

// Mounted at /api/gdpr (FR19: data privacy controls)
const router = express.Router();
router.use(requireAuth);

// Right to access / data portability
router.get('/export', asyncHandler(async (req, res) => {
  const data = await gdprService.exportUserData(req.userId);
  await auditService.logAction('DATA_EXPORT', req.user.username, 'User exported personal data (GDPR)', req.ip, 'SUCCESS', req.user._id);
  res.json({ success: true, data });
}));

// Right to erasure: local accounts confirm with their password, Google-only accounts type DELETE
router.delete('/delete-account', asyncHandler(async (req, res) => {
  const { password, reason, confirm } = req.body || {};
  const user = await UserModel.findById(req.userId);
  if (!user) throw new HttpError(404, 'User not found');

  if (user.password) {
    if (!(await user.comparePassword(password))) throw new HttpError(401, 'Invalid password');
  } else if (confirm !== 'DELETE') {
    throw new HttpError(400, 'Type DELETE to confirm account deletion');
  }

  await auditService.logAction('ACCOUNT_DELETION_REQUEST', user.username, 'User requested account deletion', req.ip, 'SUCCESS', user._id);
  const summary = await gdprService.deleteUserData(req.userId, typeof reason === 'string' && reason.trim() ? reason.trim() : 'User requested');

  res.json({
    success: true,
    message: 'Account and all associated data have been permanently deleted',
    summary
  });
}));

router.get('/consent', asyncHandler(async (req, res) => {
  res.json(await gdprService.getConsentStatus(req.userId));
}));

router.put('/consent', asyncHandler(async (req, res) => {
  const updated = await gdprService.updateConsent(req.userId, req.body || {});
  await auditService.logAction('CONSENT_UPDATE', req.user.username, `Consent updated: ${JSON.stringify(updated.consents)}`, req.ip, 'SUCCESS', req.user._id);
  res.json(updated);
}));

export default router;
