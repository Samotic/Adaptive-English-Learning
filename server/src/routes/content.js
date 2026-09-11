import express from 'express';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import * as contentService from '../services/contentService.js';

// Content management (FR20): lessons, translations and simplified content blocks
const router = express.Router();

router.get('/lessons', requireAuth, asyncHandler(async (req, res) => {
  const { topic, level, isActive } = req.query;
  res.json(await contentService.listLessons({
    topic,
    level,
    isActive: isActive === undefined ? undefined : isActive === 'true'
  }));
}));

router.post('/lessons', requireAuth, requireStaff, asyncHandler(async (req, res) => {
  res.status(201).json(await contentService.createLesson(req.body || {}));
}));

router.get('/lessons/:lessonId/content', requireAuth, asyncHandler(async (req, res) => {
  const languageCode = typeof req.query.languageCode === 'string' ? req.query.languageCode.slice(0, 10) : 'en';
  const lesson = await contentService.getLessonContent(req.params.lessonId, languageCode);
  if (!lesson) throw new HttpError(404, 'Lesson not found');
  res.json(lesson);
}));

router.post('/lessons/:lessonId/translations', requireAuth, requireStaff, asyncHandler(async (req, res) => {
  res.json(await contentService.upsertLessonTranslation(req.params.lessonId, req.body || {}));
}));

router.get('/lessons/:lessonId', requireAuth, asyncHandler(async (req, res) => {
  const lesson = await contentService.getLessonById(req.params.lessonId);
  if (!lesson) throw new HttpError(404, 'Lesson not found');
  res.json(lesson);
}));

router.get('/content-blocks', requireAuth, asyncHandler(async (req, res) => {
  res.json(await contentService.listContentBlocks(req.query));
}));

router.post('/content-blocks', requireAuth, requireStaff, asyncHandler(async (req, res) => {
  res.status(201).json(await contentService.createContentBlock(req.body || {}));
}));

// Called after a wrong answer to fetch easier material for the topic
router.post('/content/request-simplification', requireAuth, asyncHandler(async (req, res) => {
  const { topic, languageCode } = req.body || {};
  if (typeof topic !== 'string' || !topic.trim()) throw new HttpError(400, 'topic is required');
  const block = await contentService.requestSimplification(topic.trim(), typeof languageCode === 'string' ? languageCode : 'en');
  if (!block) throw new HttpError(404, 'No content found for topic');
  res.json(block);
}));

export default router;
