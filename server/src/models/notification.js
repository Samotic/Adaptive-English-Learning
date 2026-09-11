import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = ['alert', 'milestone', 'reminder', 'system', 'assignment', 'review'];

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: NOTIFICATION_TYPES, default: 'system' },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  read: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const NotificationModel =
  mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
export default NotificationModel;
