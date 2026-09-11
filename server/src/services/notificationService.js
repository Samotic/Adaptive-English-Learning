/**
 * Notification Service
 * FR17: Configurable Notifications (Email / In-App)
 * UC16: Configure Notification Preferences
 *
 * Notifications and preferences are stored in MongoDB. Email is delivered through SMTP when
 * configured (see emailService). Push delivery is not implemented; the preference is stored only.
 */
import mongoose from 'mongoose';
import NotificationModel from '../models/notification.js';
import NotificationPreferenceModel from '../models/notificationPreference.js';
import UserModel from '../models/user.js';
import { config } from '../config.js';
import { sendEmail } from './emailService.js';

const PREFERENCE_FIELDS = ['emailEnabled', 'pushEnabled', 'inAppEnabled'];

function toPreferenceDTO(prefs) {
  return {
    emailEnabled: prefs?.emailEnabled ?? true,
    pushEnabled: prefs?.pushEnabled ?? false,
    inAppEnabled: prefs?.inAppEnabled ?? true
  };
}

export function toNotificationDTO(n) {
  return {
    id: n._id.toString(),
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    timestamp: n.createdAt
  };
}

export async function getUserPreferences(userId) {
  const prefs = await NotificationPreferenceModel.findOne({ user: userId }).lean();
  return toPreferenceDTO(prefs);
}

export async function updateUserPreferences(userId, preferences = {}) {
  const update = {};
  for (const field of PREFERENCE_FIELDS) {
    if (typeof preferences[field] === 'boolean') update[field] = preferences[field];
  }
  const prefs = await NotificationPreferenceModel.findOneAndUpdate(
    { user: userId },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  return toPreferenceDTO(prefs);
}

/** Delivers a notification according to the user's preferences. Never throws. */
export async function sendNotification(userId, type, title, message = '') {
  try {
    const prefs = await getUserPreferences(userId);
    let notification = null;

    if (prefs.inAppEnabled) {
      notification = await NotificationModel.create({ user: userId, type, title, message });
    }

    if (prefs.emailEnabled) {
      const user = await UserModel.findById(userId).select('email').lean();
      if (user?.email) {
        const sent = await sendEmail({ to: user.email, subject: title, text: message });
        if (sent && notification) {
          await NotificationModel.updateOne({ _id: notification._id }, { $set: { emailSent: true } });
        }
      }
    }

    return notification ? toNotificationDTO(notification) : null;
  } catch (err) {
    console.error('[Notification] Failed to send notification:', err.message);
    return null;
  }
}

export const sendPerformanceAlert = (userId, currentScore) =>
  sendNotification(userId, 'alert', 'Performance Alert ⚠️',
    `Your proficiency score has dropped to ${currentScore}. We recommend reviewing previous modules.`);

export const sendMilestoneAchieved = (userId, milestone) =>
  sendNotification(userId, 'milestone', 'Milestone Achieved! 🎉', `Great job! You've achieved: ${milestone}`);

export const sendReviewReminder = (userId, topicName) =>
  sendNotification(userId, 'reminder', 'Time to Review! ⏰', `Don't forget to review: ${topicName}`);

export const sendSupportConfirmation = (userId, ticketNumber) =>
  sendNotification(userId, 'system', 'Support Request Received 🎫',
    `Your ticket #${ticketNumber} has been created and is under review.`);

export async function sendVerificationEmail(email, token) {
  const link = `${config.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: email,
    subject: 'Verify your Adaptive English account',
    text: `Welcome to Adaptive English! Confirm your email address by opening this link:\n\n${link}`
  });
}

export async function getUnreadNotifications(userId, limit = 50) {
  const items = await NotificationModel.find({ user: userId, read: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return items.map(toNotificationDTO);
}

export async function getAllNotifications(userId, limit = 100) {
  const items = await NotificationModel.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return items.map(toNotificationDTO);
}

export async function markAsRead(userId, notificationId) {
  if (!mongoose.isValidObjectId(notificationId)) return false;
  const result = await NotificationModel.updateOne(
    { _id: notificationId, user: userId },
    { $set: { read: true } }
  );
  return result.matchedCount > 0;
}

export async function markAllAsRead(userId) {
  const result = await NotificationModel.updateMany({ user: userId, read: false }, { $set: { read: true } });
  return result.modifiedCount;
}
