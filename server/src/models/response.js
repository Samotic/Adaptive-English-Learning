import mongoose from 'mongoose';

const ResponseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  correct: { type: Boolean, required: true },
  timestamp: { type: Date, default: () => new Date() },
  nextReview: { type: Date, default: () => new Date() },
  userAnswer: { type: String, default: '' },
  responseMode: { type: String, enum: ['objective', 'free-text', 'speech'], default: 'objective' },

  // Automated grading (free-text and speech)
  nlpGrade: { type: Number },
  nlpConfidence: { type: Number },
  isSpeech: { type: Boolean, default: false },
  speechMetrics: {
    fluency: Number,
    vocabulary: Number,
    coherence: Number,
    wordCount: Number,
    sentenceCount: Number
  },

  // Teacher review of low-confidence automated grades
  reviewStatus: { type: String, enum: ['auto', 'pending_review', 'reviewed'], default: 'auto' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  teacherFeedback: { type: String },

  syncedFromOffline: { type: Boolean, default: false }
}, { timestamps: true });

ResponseSchema.index({ user: 1, question: 1, timestamp: -1 });
ResponseSchema.index({ reviewStatus: 1, createdAt: 1 });

export const ResponseModel = mongoose.models.Response || mongoose.model('Response', ResponseSchema);
export default ResponseModel;
