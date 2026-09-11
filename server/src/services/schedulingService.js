/**
 * Scheduling Service - FR12: Schedule Lessons, Assignments, and Deadlines
 * Handles assignment creation, scheduling, and tracking
 */
import mongoose from 'mongoose';
import AssignmentModel from '../models/assignment.js';
import * as notificationService from './notificationService.js';
import { HttpError } from '../middleware/errors.js';

const STATUSES = ['draft', 'published', 'completed', 'archived'];

function parseDate(value, field, required = false) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new HttpError(400, `${field} is required`);
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new HttpError(400, `${field} is not a valid date`);
  return date;
}

function parseIdList(values, field) {
  if (values === undefined) return undefined;
  if (!Array.isArray(values)) throw new HttpError(400, `${field} must be an array`);
  const ids = values
    .map((v) => (v && typeof v === 'object' ? v.value ?? v._id : v))
    .filter(Boolean)
    .map(String);
  if (ids.some((id) => !mongoose.isValidObjectId(id))) throw new HttpError(400, `${field} contains an invalid id`);
  return [...new Set(ids)];
}

/** Whitelists and validates assignment fields coming from a request body. */
function sanitizeAssignment(data = {}, { partial = false } = {}) {
  const out = {};

  if (!partial || data.title !== undefined) {
    if (typeof data.title !== 'string' || !data.title.trim()) throw new HttpError(400, 'title is required');
    out.title = data.title.trim().slice(0, 200);
  }
  if (data.description !== undefined) out.description = String(data.description).slice(0, 5000);

  const students = parseIdList(data.students, 'students');
  if (students) out.students = students;
  const questions = parseIdList(data.questions, 'questions');
  if (questions) out.questions = questions;

  if (data.module !== undefined) {
    if (data.module === null || data.module === '') out.module = null;
    else if (!mongoose.isValidObjectId(data.module)) throw new HttpError(400, 'Invalid module');
    else out.module = data.module;
  }

  const dueDate = parseDate(data.dueDate, 'dueDate', !partial);
  if (dueDate) out.dueDate = dueDate;
  const startDate = parseDate(data.startDate, 'startDate');
  if (startDate) out.startDate = startDate;
  if (out.startDate && out.dueDate && out.startDate > out.dueDate) {
    throw new HttpError(400, 'dueDate must be after startDate');
  }

  if (data.points !== undefined) {
    const points = Number(data.points);
    if (!Number.isFinite(points) || points < 0) throw new HttpError(400, 'points must be a non-negative number');
    out.points = points;
  }

  if (partial && data.status !== undefined) {
    if (!STATUSES.includes(data.status)) throw new HttpError(400, 'Invalid status');
    out.status = data.status;
  }

  return out;
}

class SchedulingService {
  async createAssignment(teacherId, assignmentData) {
    return AssignmentModel.create({
      points: 100,
      ...sanitizeAssignment(assignmentData),
      teacher: teacherId,
      status: 'draft'
    });
  }

  /** Makes an assignment visible to its students and notifies them. */
  async publishAssignment(assignmentId, teacherId) {
    const assignment = await AssignmentModel.findOneAndUpdate(
      { _id: assignmentId, teacher: teacherId },
      { status: 'published' },
      { new: true }
    ).populate('students', 'username email');

    if (assignment) {
      await Promise.all(assignment.students.map((student) =>
        notificationService.sendNotification(
          student._id,
          'assignment',
          `New assignment: ${assignment.title}`,
          `Due: ${assignment.dueDate.toLocaleDateString()}`
        )
      ));
    }

    return assignment;
  }

  async getTeacherAssignments(teacherId, filters = {}) {
    const query = { teacher: teacherId };
    if (STATUSES.includes(filters.status)) query.status = filters.status;

    return AssignmentModel.find(query)
      .populate('students', 'username email')
      .populate('module', 'title skill level')
      .sort({ dueDate: 1 });
  }

  async getStudentAssignments(studentId, filters = {}) {
    const query = { students: studentId, status: 'published' };

    if (filters.status === 'upcoming') {
      query.dueDate = { $gte: new Date() };
    } else if (filters.status === 'overdue') {
      query.dueDate = { $lt: new Date() };
      query['submissions.student'] = { $ne: studentId };
    }

    const assignments = await AssignmentModel.find(query)
      .populate('teacher', 'username email')
      .populate('module', 'title skill level')
      .sort({ dueDate: 1 });

    return assignments.map((assignment) => {
      const submission = assignment.submissions.find((s) => s.student?.toString() === String(studentId));
      const { submissions, ...rest } = assignment.toObject();
      return {
        ...rest,
        completed: Boolean(submission),
        score: submission?.score,
        submittedAt: submission?.submittedAt
      };
    });
  }

  async submitAssignment(assignmentId, studentId, score) {
    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) throw new HttpError(404, 'Assignment not found');
    if (assignment.status !== 'published') throw new HttpError(400, 'This assignment is not open for submissions');
    if (!assignment.students.some((s) => s.toString() === String(studentId))) {
      throw new HttpError(403, 'You are not assigned to this assignment');
    }
    if (assignment.submissions.some((s) => s.student?.toString() === String(studentId))) {
      throw new HttpError(409, 'Assignment already submitted');
    }

    let numericScore;
    if (score !== undefined && score !== null && score !== '') {
      numericScore = Number(score);
      if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > assignment.points) {
        throw new HttpError(400, `score must be between 0 and ${assignment.points}`);
      }
    }

    assignment.submissions.push({
      student: studentId,
      submittedAt: new Date(),
      score: numericScore,
      completed: true
    });
    await assignment.save();

    await notificationService.sendNotification(
      assignment.teacher,
      'assignment',
      `Assignment submitted: ${assignment.title}`,
      numericScore !== undefined ? `A student submitted with score ${numericScore}` : 'A student submitted the assignment'
    );

    return assignment;
  }

  async updateAssignment(assignmentId, teacherId, updates) {
    const changes = sanitizeAssignment(updates, { partial: true });
    return AssignmentModel.findOneAndUpdate(
      { _id: assignmentId, teacher: teacherId },
      { $set: changes },
      { new: true, runValidators: true }
    );
  }

  async deleteAssignment(assignmentId, teacherId) {
    const result = await AssignmentModel.deleteOne({ _id: assignmentId, teacher: teacherId });
    return result.deletedCount > 0;
  }

  /** Calendar events: teachers and admins see assignments they created, students their published ones. */
  async getCalendar(userId, role, startDate, endDate) {
    const isStaff = role === 'teacher' || role === 'admin';
    const query = isStaff ? { teacher: userId } : { students: userId, status: 'published' };

    const start = parseDate(startDate, 'startDate');
    const end = parseDate(endDate, 'endDate');
    if (start || end) {
      query.dueDate = {};
      if (start) query.dueDate.$gte = start;
      if (end) query.dueDate.$lte = end;
    }

    const assignments = await AssignmentModel.find(query)
      .populate('module', 'title')
      .sort({ dueDate: 1 });

    return assignments.map((a) => ({
      id: a._id,
      title: a.title,
      description: a.description,
      start: a.startDate,
      end: a.dueDate,
      date: a.dueDate,
      module: a.module?.title,
      status: isStaff
        ? a.status
        : (a.submissions.some((s) => s.student?.toString() === String(userId)) ? 'completed' : a.status),
      points: a.points
    }));
  }
}

export default new SchedulingService();
