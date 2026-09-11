/**
 * Notification API client (kept for backwards compatibility).
 * Prefer the notification functions exported from ../api.js.
 */
import { getUnreadNotifications, getAllNotifications, markNotificationAsRead } from '../api';

export const notificationAPI = {
  getUnread: async (token) => (await getUnreadNotifications(token)).notifications || [],
  getAll: async (token) => (await getAllNotifications(token)).notifications || [],
  markAsRead: async (token, notificationId) => (await markNotificationAsRead(token, notificationId)).success
};
