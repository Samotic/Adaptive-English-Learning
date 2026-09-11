#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

// Define schemas
const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  answer: { type: String, required: true },
  options: [String],
  difficulty: { type: Number, default: 0.5 },
  skill: { type: String, enum: ['reading', 'writing', 'listening', 'speaking'], required: true },
  type: { type: String, enum: ['multiple-choice', 'free-text', 'fill-in-blank', 'true-false', 'matching', 'essay'], default: 'multiple-choice' },
  audioUrl: String,
  audioText: String,
  explanation: String,
  isOpenEnded: Boolean,
  evaluationType: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'questions' });

const moduleSchema = new mongoose.Schema({
  title: String,
  skill: String,
  level: Number,
  description: String,
  difficulty: Number,
  estimatedTime: String,
  prerequisites: Array,
  learningObjectives: Array,
  items: [{
    questionId: mongoose.Schema.Types.ObjectId,
    title: String,
    type: String,
    difficulty: Number
  }],
  exercises: [mongoose.Schema.Types.ObjectId]
}, { collection: 'modules' });

const QuestionModel = mongoose.model('Question', questionSchema);
const ModuleModel = mongoose.model('Module', moduleSchema);

async function seedModulesWithAudio() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    const questionsCollection = db.collection('questions');
    const modulesCollection = db.collection('modules');

    // Get listening questions with audio
    const listeningQuestions = await questionsCollection.find({ 
      skill: 'listening',
      audioUrl: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`✓ Found ${listeningQuestions.length} listening questions with audio`);

    if (listeningQuestions.length === 0) {
      console.log('⚠️ No listening questions with audio found. Seed the questions first!');
      process.exit(1);
    }

    // Update listening module with audio questions
    const listeningItems = listeningQuestions.map((q, i) => ({
      questionId: q._id,
      title: `Listening Question ${i + 1}`,
      type: 'listening',
      difficulty: q.difficulty
    }));

    await modulesCollection.updateOne(
      { title: 'Listening - Everyday Dialogues' },
      { $set: { items: listeningItems } },
      { upsert: true }
    );
    console.log(`✓ Updated listening module with ${listeningItems.length} audio questions`);

    // Get other question types
    const readingQuestions = await questionsCollection.find({ skill: 'reading' }).limit(5).toArray();
    const writingQuestions = await questionsCollection.find({ skill: 'writing' }).limit(5).toArray();
    const speakingQuestions = await questionsCollection.find({ skill: 'speaking' }).limit(3).toArray();

    // Update reading module
    if (readingQuestions.length > 0) {
      const readingItems = readingQuestions.map((q, i) => ({
        questionId: q._id,
        title: `Reading Question ${i + 1}`,
        type: 'reading',
        difficulty: q.difficulty
      }));
      
      await modulesCollection.updateOne(
        { title: 'Reading - Everyday Situations' },
        { $set: { items: readingItems } },
        { upsert: true }
      );
      console.log(`✓ Updated reading module with ${readingItems.length} questions`);
    }

    // Update writing module
    if (writingQuestions.length > 0) {
      const writingItems = writingQuestions.map((q, i) => ({
        questionId: q._id,
        title: `Writing Question ${i + 1}`,
        type: 'writing',
        difficulty: q.difficulty
      }));
      
      await modulesCollection.updateOne(
        { title: 'Writing - Paragraphs' },
        { $set: { items: writingItems } },
        { upsert: true }
      );
      console.log(`✓ Updated writing module with ${writingItems.length} questions`);
    }

    // Update speaking module
    if (speakingQuestions.length > 0) {
      const speakingItems = speakingQuestions.map((q, i) => ({
        questionId: q._id,
        title: `Speaking Question ${i + 1}`,
        type: 'speaking',
        difficulty: q.difficulty
      }));
      
      await modulesCollection.updateOne(
        { title: 'Speaking - Daily Conversations' },
        { $set: { items: speakingItems } },
        { upsert: true }
      );
      console.log(`✓ Updated speaking module with ${speakingItems.length} questions`);
    }

    console.log('\n✅ Successfully linked questions to modules!');
    console.log('🎧 Listening questions now have audio support!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedModulesWithAudio();
