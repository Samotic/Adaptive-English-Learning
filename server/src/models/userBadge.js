import mongoose from 'mongoose';

const UserBadgeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    current: Number, // Current progress towards badge
    required: Number // Required amount for badge
  },
  notified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Compound index to prevent duplicate badges for same user
UserBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });

export default mongoose.models.UserBadge || mongoose.model('UserBadge', UserBadgeSchema);
