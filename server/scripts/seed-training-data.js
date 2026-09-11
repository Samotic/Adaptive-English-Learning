/**
 * Seed Training Data
 * Generates sample training data for testing ML retraining
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import TrainingDataModel from '../src/models/trainingData.js';
import QuestionModel from '../src/models/question.js';
import UserModel from '../src/models/user.js';

async function seedTrainingData() {
  console.log('🌱 Seeding training data for ML Ops testing...\n');
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');

    // Get some questions and users
    const questions = await QuestionModel.find().limit(20);
    const users = await UserModel.find().limit(10);
    
    console.log(`Found ${questions.length} questions and ${users.length} users\n`);
    
    if (questions.length === 0) {
      console.log('⚠️  No questions found in database.');
      console.log('   Creating sample questions for testing...\n');
      
      // Create some dummy questions for testing
      const skills = ['reading', 'writing', 'listening', 'speaking'];
      const dummyQuestions = [];
      for (let i = 0; i < 20; i++) {
        dummyQuestions.push({
          text: `Sample question ${i + 1}?`,
          answer: String.fromCharCode(65 + (i % 4)), // A, B, C, D
          difficulty: Math.random(),
          skill: skills[i % 4],
          type: 'objective',
          choices: ['Option A', 'Option B', 'Option C', 'Option D']
        });
      }
      const created = await QuestionModel.insertMany(dummyQuestions);
      questions.push(...created);
      console.log(`✅ Created ${created.length} sample questions\n`);
    }
    
    // Generate 500 training samples
    const samples = [];
    const interactionTypes = ['quiz_answer', 'click', 'page_view', 'module_start'];
    
    for (let i = 0; i < 500; i++) {
      const question = questions[Math.floor(Math.random() * questions.length)];
      const userId = users.length > 0 
        ? users[Math.floor(Math.random() * users.length)]._id.toString()
        : `test_user_${Math.floor(Math.random() * 10)}`;
      
      // Simulate different student abilities
      const userAbility = Math.random(); // 0-1
      const questionDifficulty = question.difficulty || Math.random();
      
      // Probability of correct answer based on ability vs difficulty
      const correctProb = 1 / (1 + Math.exp(-(userAbility - questionDifficulty) * 4));
      const isCorrect = Math.random() < correctProb;
      
      samples.push({
        anonymizedUserId: crypto.createHash('sha256').update(userId).digest('hex'),
        interactionType: 'quiz_answer',
        questionId: question._id,
        questionDifficulty: questionDifficulty,
        answerCorrect: isCorrect,
        responseTime: 5000 + Math.random() * 25000, // 5-30 seconds
        moduleId: question.moduleId || null,
        userLevel: Math.floor(userAbility * 10),
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
      });
      
      // Add some non-quiz interactions
      if (Math.random() < 0.2) {
        samples.push({
          anonymizedUserId: crypto.createHash('sha256').update(userId).digest('hex'),
          interactionType: interactionTypes[Math.floor(Math.random() * 3) + 1],
          moduleId: question.moduleId || null,
          timeSpent: Math.random() * 300000, // 0-5 minutes
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
      }
    }
    
    // Clear existing training data
    await TrainingDataModel.deleteMany({});
    console.log('🗑️  Cleared existing training data\n');
    
    // Insert samples
    await TrainingDataModel.insertMany(samples);
    console.log(`✅ Created ${samples.length} training data samples\n`);
    
    // Show statistics
    const quizAnswers = samples.filter(s => s.interactionType === 'quiz_answer');
    const correctCount = quizAnswers.filter(s => s.answerCorrect).length;
    const avgDifficulty = quizAnswers.reduce((sum, s) => sum + s.questionDifficulty, 0) / quizAnswers.length;
    
    console.log('📊 Statistics:');
    console.log(`   Quiz answers: ${quizAnswers.length}`);
    console.log(`   Correct: ${correctCount} (${(correctCount / quizAnswers.length * 100).toFixed(1)}%)`);
    console.log(`   Average difficulty: ${avgDifficulty.toFixed(2)}`);
    console.log();
    
    console.log('✅ Training data seeded successfully!');
    console.log('🚀 Now run: node scripts/retrain.js');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedTrainingData();
