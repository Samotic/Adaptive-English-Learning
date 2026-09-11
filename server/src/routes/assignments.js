import express from 'express';
import { requireAuth, requireStaff, isStaff } from '../middleware/auth.js';
import { asyncHandler, assertObjectId, HttpError } from '../middleware/errors.js';
import schedulingService from '../services/schedulingService.js';

// FR12: schedule lessons, assignments and deadlines
const router = express.Router();

const withAssignmentId = (handler) => asyncHandler(async (req, res) => {
  assertObjectId(req.params.assignmentId, 'assignment id');
  return handler(req, res);
});

router.post('/assignments', requireAuth, requireStaff, asyncHandler(async (req, res) => {
  res.status(201).json(await schedulingService.createAssignment(req.userId, req.body || {}));
}));

router.get('/assignments', requireAuth, asyncHandler(async (req, res) => {
  res.json(isStaff(req.user)
    ? await schedulingService.getTeacherAssignments(req.userId, req.query)
    : await schedulingService.getStudentAssignments(req.userId, req.query));
}));

router.post('/assignments/:assignmentId/publish', requireAuth, requireStaff, withAssignmentId(async (req, res) => {
  const assignment = await schedulingService.publishAssignment(req.params.assignmentId, req.userId);
  if (!assignment) throw new HttpError(404, 'Assignment not found');
  res.json(assignment);
}));

router.post('/assignments/:assignmentId/submit', requireAuth, withAssignmentId(async (req, res) => {
  const assignment = await schedulingService.submitAssignment(req.params.assignmentId, req.userId, req.body?.score);
  res.json({ success: true, assignment });
}));

router.put('/assignments/:assignmentId', requireAuth, requireStaff, withAssignmentId(async (req, res) => {
  const assignment = await schedulingService.updateAssignment(req.params.assignmentId, req.userId, req.body || {});
  if (!assignment) throw new HttpError(404, 'Assignment not found');
  res.json(assignment);
}));

router.delete('/assignments/:assignmentId', requireAuth, requireStaff, withAssignmentId(async (req, res) => {
  const deleted = await schedulingService.deleteAssignment(req.params.assignmentId, req.userId);
  if (!deleted) throw new HttpError(404, 'Assignment not found');
  res.json({ success: true, message: 'Assignment deleted' });
}));

router.get('/calendar', requireAuth, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  res.json(await schedulingService.getCalendar(req.userId, req.user.role, startDate, endDate));
}));

export default router;
