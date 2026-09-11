import crypto from 'crypto';
import mongoose from 'mongoose';

/**
 * Training Data Schema for AI Model Retraining
 * Stores anonymized student interactions for future model improvements
 * UC18: Retrain/Update AI Models - Anonymized training data
 */
const TrainingDataSchema = new mongoose.Schema({
  // Anonymization: Use hashed userId instead of direct reference
  anonymizedUserId: { 
    type: String, 
    required: true,
    index: true 
  },
  
  // User metadata (anonymized)
  userLevel: { type: Number },  // Student's ability level (theta)
  userRole: { type: String, enum: ['student', 'teacher', 'admin'] },
  
  // Interaction type
  interactionType: { 
    type: String, 
    required: true,
    enum: [
      'quiz_answer',        // Student answered a quiz question
      'click',              // General click interaction
      'page_view',          // Page navigation
      'module_start',       // Started a learning module
      'module_complete',    // Completed a learning module
      'path_generated',     // Initial path generation
      'session_start',      // User session began
      'session_end'         // User session ended
    ],
    index: true
  },
  
  // Quiz/Assessment data (when applicable)
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  questionDifficulty: { type: Number },
  answerCorrect: { type: Boolean },
  responseTime: { type: Number },  // Time to answer in seconds
  
  // Learning path data
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
  moduleLevel: { type: Number },
  moduleSkill: { type: String },
  
  // Engagement metrics
  timeSpent: { type: Number },  // Time spent on activity (seconds)
  sessionDuration: { type: Number },  // Total session duration
  
  // Click/Navigation data
  elementClicked: { type: String },  // e.g., 'submit_button', 'next_module'
  pageUrl: { type: String },
  previousPage: { type: String },
  
  // Performance context
  consecutiveCorrect: { type: Number, default: 0 },
  consecutiveIncorrect: { type: Number, default: 0 },
  sessionQuestionsAnswered: { type: Number, default: 0 },
  
  // Additional metadata for ML training
  metadata: { type: mongoose.Schema.Types.Mixed },
  
  // Timestamp
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

TrainingDataSchema.index({ interactionType: 1, timestamp: -1 });
TrainingDataSchema.index({ anonymizedUserId: 1, timestamp: -1 });

// One-way hash so training data cannot be linked back to an account
TrainingDataSchema.statics.anonymizeUserId = function anonymizeUserId(userId) {
  return crypto.createHash('sha256').update(userId.toString()).digest('hex');
};

export const TrainingDataModel = mongoose.models.TrainingData || 
  mongoose.model('TrainingData', TrainingDataSchema);

export default TrainingDataModel;
