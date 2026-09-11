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
  text: String,
  skill: String,
  audioUrl: String,
}, { collection: 'questions' });

const moduleSchema = new mongoose.Schema({
  title: String,
  skill: String,
  items: Array,
}, { collection: 'modules' });

const QuestionModel = mongoose.model('Question', questionSchema);
const ModuleModel = mongoose.model('Module', moduleSchema);

async function linkAudioQuestionsToModules() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
    console.log('✓ Connected to MongoDB');

    // Get all questions with audio
    const audioQuestions = await QuestionModel.find({ audioUrl: { $exists: true, $ne: null } });
    console.log(`✓ Found ${audioQuestions.length} questions with audio`);

    // Get all listening modules
    const listeningModules = await ModuleModel.find({ skill: 'listening' });
    console.log(`✓ Found ${listeningModules.length} listening modules`);

    // Update each listening module to include audio questions
    let updatedCount = 0;
    for (const module of listeningModules) {
      if (module.items && module.items.length > 0) {
        // Replace question IDs with audio question IDs
        const newItems = audioQuestions.slice(0, module.items.length).map((q, i) => ({
          ...module.items[i],
          questionId: q._id
        }));
        
        await ModuleModel.updateOne(
          { _id: module._id },
          { items: newItems }
        );
        console.log(`✓ Updated module "${module.title}" with ${newItems.length} audio questions`);
        updatedCount++;
      }
    }

    console.log(`\n✅ Updated ${updatedCount} listening modules with audio questions!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

linkAudioQuestionsToModules();
