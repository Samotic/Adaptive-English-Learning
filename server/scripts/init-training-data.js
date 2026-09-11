/**
 * Database initialization script for Training Data Collection
 * Ensures indexes are created for optimal query performance
 * 
 * Run this once after deploying the training data collection system:
 * node scripts/init-training-data.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });

import TrainingDataModel from '../src/models/trainingData.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

async function initializeTrainingDataCollection() {
  console.log('🚀 Initializing Training Data Collection System\n');

  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
    console.log('✅ Connected to MongoDB\n');

    // Create indexes
    console.log('Creating database indexes...');
    await TrainingDataModel.collection.createIndex({ timestamp: -1 });
    await TrainingDataModel.collection.createIndex({ anonymizedUserId: 1 });
    await TrainingDataModel.collection.createIndex({ interactionType: 1, timestamp: -1 });
    await TrainingDataModel.collection.createIndex({ questionId: 1 });
    await TrainingDataModel.collection.createIndex({ moduleId: 1 });
    console.log('✅ Indexes created\n');

    // Get collection stats
    const count = await TrainingDataModel.countDocuments();
    console.log(`📊 Current training data records: ${count}\n`);

    // List indexes
    console.log('📋 Available indexes:');
    const indexes = await TrainingDataModel.collection.indexes();
    indexes.forEach(index => {
      console.log(`   - ${Object.keys(index.key).join(', ')}`);
    });

    console.log('\n✨ Initialization complete!\n');
    console.log('The system is ready to collect training data.');
    console.log('Next steps:');
    console.log('1. Start your server: cd server && npm start');
    console.log('2. Integrate tracking into your components');
    console.log('3. Monitor data collection in admin dashboard\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run initialization
initializeTrainingDataCollection();
