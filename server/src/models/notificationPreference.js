import mongoose from 'mongoose';

const NotificationPreferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  emailEnabled: { type: Boolean, default: true },
  pushEnabled: { type: Boolean, default: false },
  inAppEnabled: { type: Boolean, default: true }
}, { timestamps: true });

export const NotificationPreferenceModel =
  mongoose.models.NotificationPreference ||
  mongoose.model('NotificationPreference', NotificationPreferenceSchema);
export default NotificationPreferenceModel;
