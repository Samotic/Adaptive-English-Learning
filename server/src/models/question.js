import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  answer: { type: String, required: true },
  difficulty: { type: Number, default: 0 },
  discrimination: { type: Number, default: 1 },
  skill: { type: String, enum: ['reading', 'writing', 'listening', 'speaking'], required: true },
  type: { type: String, enum: ['objective', 'multiple-choice', 'free-text', 'fill-in-blank', 'true-false', 'matching', 'essay', 'listening', 'reading', 'writing', 'speaking'], default: 'objective' },
  options: [{ type: String }],  // Multiple choice options (for objective type)
  audioUrl: { type: String },   // Audio file URL for listening questions
  audioText: { type: String },  // Transcript of audio content for accessibility
  explanation: { type: String } // Explanation for correct answer
}, { timestamps: true });

export const QuestionModel = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
export default QuestionModel;
