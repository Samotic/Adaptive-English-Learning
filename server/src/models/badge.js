import mongoose from 'mongoose';

const BadgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String, // Emoji or icon name
    default: '🏆'
  },
  category: {
    type: String,
    enum: ['achievement', 'streak', 'mastery', 'milestone', 'special'],
    default: 'achievement'
  },
  criteria: {
    type: {
      type: String,
      enum: ['questions_correct', 'streak_days', 'skill_mastery', 'theta_threshold', 'custom'],
      required: true
    },
    threshold: {
      type: Number, // e.g., 100 questions, 7 days streak, theta >= 2.0
      required: true
    },
    skill: String, // Optional: for skill-specific badges
    metadata: mongoose.Schema.Types.Mixed // Additional criteria data
  },
  points: {
    type: Number,
    default: 10
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.models.Badge || mongoose.model('Badge', BadgeSchema);
