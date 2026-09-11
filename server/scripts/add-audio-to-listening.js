/**
 * Prepares listening questions for playback.
 *
 * The client reads `audioText` aloud with the browser's text-to-speech, so every listening question
 * needs a transcript. This script:
 *  - extracts transcripts embedded in question text ("[Audio: '...'] - question")
 *  - removes placeholder audio URLs that pointed at unrelated sample music
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });

import QuestionModel from '../src/models/question.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const PLACEHOLDER_AUDIO = /soundhelix\.com|example\.com\/audio/i;

async function prepareListeningQuestions() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
    console.log('✓ Connected to MongoDB');

    const questions = await QuestionModel.find({ skill: 'listening' });
    console.log(`Found ${questions.length} listening questions`);

    let updated = 0;
    let missingTranscript = 0;

    for (const question of questions) {
      const update = {};
      const unset = {};

      const embedded = question.text.match(/\[Audio:\s*'([^']+)'\]\s*-\s*/);
      if (embedded) {
        update.text = question.text.replace(embedded[0], '');
        if (!question.audioText) update.audioText = embedded[1];
      }

      if (question.audioUrl && PLACEHOLDER_AUDIO.test(question.audioUrl)) {
        unset.audioUrl = 1;
      }

      if (!question.audioText && !update.audioText) missingTranscript++;

      if (Object.keys(update).length || Object.keys(unset).length) {
        await QuestionModel.updateOne({ _id: question._id }, {
          ...(Object.keys(update).length && { $set: update }),
          ...(Object.keys(unset).length && { $unset: unset })
        });
        updated++;
      }
    }

    console.log(`✅ Updated ${updated} listening questions`);
    if (missingTranscript) {
      console.warn(`⚠️  ${missingTranscript} listening questions have no audioText; add a transcript so they can be played.`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

prepareListeningQuestions();
