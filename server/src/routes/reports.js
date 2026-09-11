import express from 'express';
import mongoose from 'mongoose';
import UserModel from '../models/user.js';
import { requireAuth, requireStaff, canAccessUser } from '../middleware/auth.js';
import { asyncHandler, assertObjectId, HttpError } from '../middleware/errors.js';
import reportExportService from '../services/reportExportService.js';

// Mounted at /api/reports (FR10 teacher analytics, FR13 exports)
const router = express.Router();
router.use(requireAuth);

const today = () => new Date().toISOString().slice(0, 10);

function authorizeStudent(req) {
  assertObjectId(req.params.userId, 'user id');
  if (!canAccessUser(req, req.params.userId)) throw new HttpError(403, 'You can only export your own report');
}

// Class overview with at-risk flags
router.get('/class', requireStaff, asyncHandler(async (req, res) => {
  res.json(await reportExportService.generateClassOverview());
}));

router.get('/class/pdf', requireStaff, asyncHandler(async (req, res) => {
  const overview = await reportExportService.generateClassOverview();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="class-report-${today()}.pdf"`);
  reportExportService.writeClassPDF(overview, res);
}));

// CSV for the given students, or every student when studentIds is omitted
router.post('/class/csv', requireStaff, asyncHandler(async (req, res) => {
  const { studentIds } = req.body || {};
  if (studentIds !== undefined && !Array.isArray(studentIds)) throw new HttpError(400, 'studentIds must be an array');

  let ids = (studentIds || []).map(String).filter((id) => mongoose.isValidObjectId(id));
  if (ids.length === 0) {
    ids = (await UserModel.find({ role: 'student' }).select('_id').lean()).map((u) => u._id.toString());
  }

  const reportData = await reportExportService.generateClassReport(ids);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="class-report-${today()}.csv"`);
  res.send(reportExportService.toCSV(reportData, 'class'));
}));

router.get('/student/:userId/csv', asyncHandler(async (req, res) => {
  authorizeStudent(req);
  const reportData = await reportExportService.generateStudentReport(req.params.userId);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="student-report-${req.params.userId}.csv"`);
  res.send(reportExportService.toCSV(reportData, 'student'));
}));

router.get('/student/:userId', asyncHandler(async (req, res) => {
  authorizeStudent(req);
  res.json(await reportExportService.generateStudentReport(req.params.userId));
}));

export default router;
