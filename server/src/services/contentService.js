/**
 * Content Service (FR20 / NFR1): lessons with translations and media, plus normal/simplified
 * content blocks. Lesson content is cached in memory for five minutes.
 */
import mongoose from 'mongoose';
import {
  LessonModel,
  LessonTranslationModel,
  MediaAssetModel,
  ContentBlockModel
} from '../models/lesson.js';
import { HttpError } from '../middleware/errors.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function clearContentCache() {
  cache.clear();
}

export async function getLessonById(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const lesson = await LessonModel.findById(id).lean();
  if (!lesson) return null;
  const [translations, mediaAssets] = await Promise.all([
    LessonTranslationModel.find({ lesson: id }).lean(),
    MediaAssetModel.find({ lesson: id }).lean()
  ]);
  return { ...lesson, translations, mediaAssets };
}

export async function createLesson(data = {}) {
  const { translations, mediaAssets, code, topic, level, defaultLanguage, estimatedMinutes, isActive } = data;
  const lesson = await LessonModel.create({ code, topic, level, defaultLanguage, estimatedMinutes, isActive });

  if (Array.isArray(translations) && translations.length) {
    await LessonTranslationModel.insertMany(translations.map((t) => ({
      lesson: lesson._id,
      languageCode: t.languageCode,
      title: t.title,
      summary: t.summary,
      contentHtml: t.contentHtml
    })));
  }
  if (Array.isArray(mediaAssets) && mediaAssets.length) {
    await MediaAssetModel.insertMany(mediaAssets.map((m) => ({
      lesson: lesson._id,
      mediaType: m.mediaType,
      url: m.url,
      caption: m.caption,
      languageCode: m.languageCode
    })));
  }

  clearContentCache();
  return getLessonById(lesson._id);
}

/** Lesson in the requested language, falling back to any available translation. */
export async function getLessonContent(lessonId, languageCode = 'en') {
  if (!mongoose.isValidObjectId(lessonId)) return null;

  const cacheKey = `lessonContent:${lessonId}:${languageCode}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const lesson = await LessonModel.findById(lessonId).lean();
  if (!lesson) return null;

  const translation =
    (await LessonTranslationModel.findOne({ lesson: lessonId, languageCode }).lean()) ||
    (await LessonTranslationModel.findOne({ lesson: lessonId, languageCode: lesson.defaultLanguage }).lean()) ||
    (await LessonTranslationModel.findOne({ lesson: lessonId }).lean());

  const mediaAssets = await MediaAssetModel.find({
    lesson: lessonId,
    $or: [{ languageCode }, { languageCode: { $exists: false } }, { languageCode: null }]
  }).lean();

  const result = { ...lesson, translation, mediaAssets };
  setCache(cacheKey, result);
  return result;
}

export async function listLessons({ topic, level, isActive } = {}) {
  const query = {};
  if (typeof topic === 'string' && topic) query.topic = topic;
  if (typeof level === 'string' && level) query.level = level;
  if (isActive !== undefined) query.isActive = isActive;
  return LessonModel.find(query).sort({ createdAt: -1 }).lean();
}

export async function upsertLessonTranslation(lessonId, { languageCode, title, summary, contentHtml } = {}) {
  if (!mongoose.isValidObjectId(lessonId)) throw new HttpError(400, 'Invalid lesson id');
  if (typeof languageCode !== 'string' || !languageCode) throw new HttpError(400, 'languageCode is required');
  if (!(await LessonModel.exists({ _id: lessonId }))) throw new HttpError(404, 'Lesson not found');

  const doc = await LessonTranslationModel.findOneAndUpdate(
    { lesson: lessonId, languageCode },
    { $set: { title, summary, contentHtml } },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  clearContentCache();
  return doc;
}

/** Simplified content for a topic (after a wrong answer), falling back to the normal variant. */
export async function requestSimplification(topic, languageCode = 'en') {
  return (
    (await ContentBlockModel.findOne({ topic, variant: 'simplified', languageCode }).lean()) ||
    (await ContentBlockModel.findOne({ topic, variant: 'normal', languageCode }).lean())
  );
}

export async function createContentBlock({ topic, variant, languageCode, title, html } = {}) {
  return ContentBlockModel.create({ topic, variant, languageCode, title, html });
}

export async function listContentBlocks({ topic, variant, languageCode } = {}) {
  const query = {};
  if (typeof topic === 'string' && topic) query.topic = topic;
  if (typeof variant === 'string' && variant) query.variant = variant;
  if (typeof languageCode === 'string' && languageCode) query.languageCode = languageCode;
  return ContentBlockModel.find(query).lean();
}
