/**
 * GDPR Service - FR19: Data Privacy Controls
 * Handles data export, deletion, and consent management.
 */
import UserModel from '../models/user.js';
import ResponseModel from '../models/response.js';
import TrainingDataModel from '../models/trainingData.js';
import AuditLogModel from '../models/auditLog.js';
import NotificationModel from '../models/notification.js';
import NotificationPreferenceModel from '../models/notificationPreference.js';
import SupportTicketModel from '../models/supportTicket.js';
import UserBadgeModel from '../models/userBadge.js';
import AssignmentModel from '../models/assignment.js';
import { HttpError } from '../middleware/errors.js';

const CONSENT_KEYS = {
  dataProcessingConsent: ['dataProcessing', 'dataProcessingConsent'],
  marketingConsent: ['marketing', 'marketingConsent'],
  analyticsConsent: ['analytics', 'analyticsConsent']
};

class GDPRService {
  /** Export all personal data (GDPR Right to Access / Data Portability). */
  async exportUserData(userId) {
    const user = await UserModel.findById(userId).select('-password -verificationToken').lean();
    if (!user) throw new HttpError(404, 'User not found');

    const anonymizedUserId = TrainingDataModel.anonymizeUserId(userId);
    const [responses, trainingData, auditLogs, notifications, tickets, badges] = await Promise.all([
      ResponseModel.find({ user: userId }).lean(),
      TrainingDataModel.find({ anonymizedUserId }).lean(),
      AuditLogModel.find({ userId }).lean(),
      NotificationModel.find({ user: userId }).lean(),
      SupportTicketModel.find({ user: userId }).lean(),
      UserBadgeModel.find({ user: userId }).populate('badge', 'name').lean()
    ]);

    const correctCount = responses.filter((r) => r.correct).length;

    return {
      exportDate: new Date().toISOString(),
      exportVersion: '2.0',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        authProvider: user.authProvider,
        theta: user.theta,
        points: user.points,
        consents: {
          dataProcessing: user.dataProcessingConsent,
          marketing: user.marketingConsent,
          analytics: user.analyticsConsent,
          updatedAt: user.consentUpdatedAt
        },
        createdAt: user.createdAt
      },
      responses: responses.map((r) => ({
        questionId: r.question,
        answer: r.userAnswer,
        correct: r.correct,
        timestamp: r.timestamp,
        nlpGrade: r.nlpGrade,
        nlpConfidence: r.nlpConfidence,
        isSpeech: r.isSpeech,
        speechMetrics: r.speechMetrics,
        reviewStatus: r.reviewStatus,
        teacherFeedback: r.teacherFeedback
      })),
      trainingData: trainingData.map((t) => ({
        interactionType: t.interactionType,
        timestamp: t.timestamp,
        questionId: t.questionId,
        answerCorrect: t.answerCorrect,
        pageUrl: t.pageUrl
      })),
      activityLog: auditLogs.map((log) => ({
        action: log.action,
        details: log.details,
        timestamp: log.timestamp,
        status: log.status
      })),
      notifications: notifications.map((n) => ({ type: n.type, title: n.title, message: n.message, read: n.read, createdAt: n.createdAt })),
      supportTickets: tickets.map((t) => ({ ticketNumber: t.ticketNumber, subject: t.subject, message: t.message, status: t.status, createdAt: t.createdAt })),
      badges: badges.map((b) => ({ badge: b.badge?.name, earnedAt: b.earnedAt })),
      statistics: {
        totalResponses: responses.length,
        correctResponses: correctCount,
        accuracy: responses.length > 0 ? `${((correctCount / responses.length) * 100).toFixed(2)}%` : '0%',
        totalInteractions: trainingData.length,
        accountAge: `${Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000)} days`
      }
    };
  }

  /** Delete all personal data (GDPR Right to Erasure). Audit logs are kept but anonymized. */
  async deleteUserData(userId, reason = 'User requested') {
    const user = await UserModel.findById(userId).lean();
    if (!user) throw new HttpError(404, 'User not found');

    const anonymizedUserId = TrainingDataModel.anonymizeUserId(userId);
    const [responses, trainingData, notifications, tickets, badges] = await Promise.all([
      ResponseModel.deleteMany({ user: userId }),
      TrainingDataModel.deleteMany({ anonymizedUserId }),
      NotificationModel.deleteMany({ user: userId }),
      SupportTicketModel.deleteMany({ user: userId }),
      UserBadgeModel.deleteMany({ user: userId }),
      NotificationPreferenceModel.deleteMany({ user: userId }),
      AssignmentModel.updateMany(
        { $or: [{ students: userId }, { 'submissions.student': userId }] },
        { $pull: { students: userId, submissions: { student: userId } } }
      )
    ]);

    const anonymizedLogs = await AuditLogModel.updateMany(
      { userId },
      { $set: { user: '[deleted user]', userId: null, ip_address: null } }
    );

    await AuditLogModel.create({
      action: 'ACCOUNT_DELETION',
      user: '[deleted user]',
      details: `Account deleted: ${String(reason).slice(0, 500)}`,
      status: 'SUCCESS'
    });

    await UserModel.deleteOne({ _id: userId });

    return {
      success: true,
      deletedAt: new Date().toISOString(),
      deletedUser: { username: user.username, email: user.email, accountCreated: user.createdAt },
      deletedRecords: {
        responses: responses.deletedCount,
        trainingData: trainingData.deletedCount,
        notifications: notifications.deletedCount,
        supportTickets: tickets.deletedCount,
        badges: badges.deletedCount,
        auditLogsAnonymized: anonymizedLogs.modifiedCount
      },
      reason
    };
  }

  async getConsentStatus(userId) {
    const user = await UserModel.findById(userId).lean();
    if (!user) throw new HttpError(404, 'User not found');

    return {
      userId: user._id,
      dataProcessingConsent: user.dataProcessingConsent ?? true,
      marketingConsent: user.marketingConsent ?? false,
      analyticsConsent: user.analyticsConsent ?? false,
      consentDate: user.consentDate || user.createdAt,
      lastUpdated: user.consentUpdatedAt || user.createdAt
    };
  }

  /** Only boolean values that are explicitly provided are changed. */
  async updateConsent(userId, consents = {}) {
    const update = {};
    for (const [field, keys] of Object.entries(CONSENT_KEYS)) {
      const key = keys.find((k) => typeof consents[k] === 'boolean');
      if (key) update[field] = consents[key];
    }
    if (Object.keys(update).length === 0) {
      throw new HttpError(400, 'Provide at least one consent value (dataProcessing, marketing, analytics)');
    }
    update.consentUpdatedAt = new Date();

    const user = await UserModel.findByIdAndUpdate(userId, { $set: update }, { new: true }).lean();
    if (!user) throw new HttpError(404, 'User not found');

    return {
      success: true,
      consents: {
        dataProcessing: user.dataProcessingConsent,
        marketing: user.marketingConsent,
        analytics: user.analyticsConsent
      },
      updatedAt: user.consentUpdatedAt
    };
  }
}

export default new GDPRService();
