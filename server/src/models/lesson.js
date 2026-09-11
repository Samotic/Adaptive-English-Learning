import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const LessonSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  defaultLanguage: { type: String, default: 'en' },
  topic: { type: String, required: true },
  level: { type: String, required: true }, // A1/B1/beginner...
  estimatedMinutes: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const LessonTranslationSchema = new mongoose.Schema({
  lesson: { type: ObjectId, ref: 'Lesson', required: true },
  languageCode: { type: String, required: true },
  title: { type: String, required: true },
  summary: { type: String },
  contentHtml: { type: String }
}, { timestamps: true });
LessonTranslationSchema.index({ lesson: 1, languageCode: 1 }, { unique: true });

const MediaAssetSchema = new mongoose.Schema({
  lesson: { type: ObjectId, ref: 'Lesson', required: true },
  mediaType: { type: String, required: true }, // "video", "pdf", "image", "audio"
  url: { type: String, required: true },
  caption: { type: String },
  languageCode: { type: String }
}, { timestamps: true });

// Normal and simplified variants of the same topic (served after wrong answers)
const ContentBlockSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  variant: { type: String, enum: ['normal', 'simplified'], default: 'normal' },
  languageCode: { type: String, default: 'en' },
  title: { type: String, required: true },
  html: { type: String, required: true }
}, { timestamps: true });
ContentBlockSchema.index({ topic: 1, variant: 1, languageCode: 1 });

export const LessonModel = mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);
export const LessonTranslationModel =
  mongoose.models.LessonTranslation || mongoose.model('LessonTranslation', LessonTranslationSchema);
export const MediaAssetModel = mongoose.models.MediaAsset || mongoose.model('MediaAsset', MediaAssetSchema);
export const ContentBlockModel =
  mongoose.models.ContentBlock || mongoose.model('ContentBlock', ContentBlockSchema);

export default LessonModel;
