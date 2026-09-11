import express from 'express';
import UserModel from '../models/user.js';
import ResponseModel from '../models/response.js';
import { requireAuth, requireAdmin, requireStaff } from '../middleware/auth.js';
import { asyncHandler, assertObjectId, HttpError } from '../middleware/errors.js';
import gdprService from '../services/gdprService.js';
import * as auditService from '../services/auditService.js';

const router = express.Router();
const PUBLIC_FIELDS = '-password -verificationToken';
const ROLES = ['student', 'teacher', 'admin'];

router.get('/admin/users', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  res.json(await UserModel.find().select(PUBLIC_FIELDS).sort({ createdAt: -1 }).lean());
}));

router.put('/admin/users/:userId/role', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  assertObjectId(req.params.userId, 'user id');
  const { role } = req.body || {};
  if (!ROLES.includes(role)) throw new HttpError(400, 'Invalid role');

  if (req.params.userId === req.userId && role !== 'admin') {
    const adminCount = await UserModel.countDocuments({ role: 'admin' });
    if (adminCount <= 1) throw new HttpError(409, 'You are the only admin. Promote another admin first.');
  }

  const user = await UserModel.findByIdAndUpdate(req.params.userId, { $set: { role } }, { new: true })
    .select(PUBLIC_FIELDS);
  if (!user) throw new HttpError(404, 'User not found');

  await auditService.logAction('ROLE_CHANGE', req.user.username, `Changed role of ${user.username} to ${role}`, req.ip, 'SUCCESS', req.user._id);
  res.json(user);
}));

// Admin access to a user's data (support/compliance), always audited
router.get('/admin/user-data/:userId', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  assertObjectId(req.params.userId, 'user id');
  const dataExport = await gdprService.exportUserData(req.params.userId);
  await auditService.logAction('ADMIN_DATA_ACCESS', req.user.username, `Admin accessed user data for: ${dataExport.user.username}`, req.ip, 'SUCCESS', req.user._id);
  res.json(dataExport);
}));

// Teacher: all students with answer statistics
router.get('/teacher/students', requireAuth, requireStaff, asyncHandler(async (req, res) => {
  const [students, stats] = await Promise.all([
    UserModel.find({ role: 'student' }).select(PUBLIC_FIELDS).sort({ username: 1 }).lean(),
    ResponseModel.aggregate([
      { $group: { _id: '$user', total: { $sum: 1 }, correct: { $sum: { $cond: ['$correct', 1, 0] } } } }
    ])
  ]);
  const statsByUser = new Map(stats.map((s) => [s._id.toString(), s]));

  res.json(students.map((student) => {
    const s = statsByUser.get(student._id.toString()) || { total: 0, correct: 0 };
    return {
      ...student,
      stats: {
        totalQuestions: s.total,
        correctAnswers: s.correct,
        accuracy: s.total ? Math.round((s.correct / s.total) * 1000) / 10 : 0
      }
    };
  }));
}));

export default router;
