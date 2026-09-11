import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  title: String,
  type: { type: String, default: 'objective' },
  difficulty: { type: Number, default: 0 },
  discrimination: { type: Number, default: 1 },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }
}, { _id: false });

const ModuleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  skill: { type: String, trim: true },
  level: { type: Number, default: 0 },
  description: String,
  difficulty: { type: Number, default: 0 },
  estimatedTime: String,
  prerequisites: [String],
  learningObjectives: [String],
  // Two supported content formats: items (with questionId) or a flat list of question ids
  items: [ItemSchema],
  exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
}, { timestamps: true });

ModuleSchema.index({ skill: 1, level: 1 });

export const ModuleModel = mongoose.models.Module || mongoose.model('Module', ModuleSchema);
export default ModuleModel;
