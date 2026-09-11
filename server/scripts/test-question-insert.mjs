// Smoke test: inserts and removes one question to verify the database connection and schema.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import QuestionModel from '../src/models/question.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';

try {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
  const question = await QuestionModel.create({
    text: 'Test question',
    answer: 'test',
    difficulty: 0.5,
    skill: 'reading',
    type: 'multiple-choice',
    options: ['test', 'other']
  });
  console.log('✓ Question created:', question._id.toString());
  await QuestionModel.deleteOne({ _id: question._id });
  console.log('✓ Test question removed');
} catch (err) {
  console.error('✗ Error:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
