/**
 * Automated ML Retraining Script
 * UC18: ML Ops - Retrain/Update AI Models
 * 
 * This script can be run:
 * 1. Manually: node server/scripts/retrain.js
 * 2. Cron job: Schedule to run daily/weekly
 * 3. API trigger: POST /api/mlops/retrain
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

// Import the retraining service
import retrainingService from '../src/services/retrainingService.js';
import ModelVersionModel from '../src/models/modelVersion.js';

/**
 * Main retraining function
 */
async function runRetraining() {
  console.log('='.repeat(60));
  console.log('🤖 ML OPS: AUTOMATED MODEL RETRAINING');
  console.log('='.repeat(60));
  console.log();
  
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    console.log();

    // Get current production model (if exists)
    const currentModel = await ModelVersionModel.getCurrentProductionModel();
    if (currentModel) {
      console.log('📦 Current production model:', currentModel.version);
      console.log('   Accuracy:', (currentModel.metrics?.accuracy * 100).toFixed(2) + '%');
      console.log('   Deployed:', currentModel.deployedAt);
    } else {
      console.log('📦 No production model found');
    }
    console.log();

    // Run retraining
    const options = {
      limit: 10000,  // Use latest 10k training samples
      autoDeploy: true  // Auto-deploy if performance > 75%
    };
    
    const result = await retrainingService.retrainModel(options);
    
    console.log();
    console.log('='.repeat(60));
    if (result.success) {
      console.log('✅ RETRAINING COMPLETED SUCCESSFULLY');
      console.log();
      console.log('📊 Results:');
      console.log('   Version:', result.version);
      console.log('   Training samples:', result.trainingDataCount);
      console.log('   Duration:', result.duration.toFixed(2) + 's');
      console.log();
      console.log('📈 Performance Metrics:');
      console.log('   Accuracy:', (result.metrics.accuracy * 100).toFixed(2) + '%');
      console.log('   Precision:', (result.metrics.precision * 100).toFixed(2) + '%');
      console.log('   Recall:', (result.metrics.recall * 100).toFixed(2) + '%');
      console.log('   F1 Score:', (result.metrics.f1Score * 100).toFixed(2) + '%');
      console.log('   RMSE:', result.metrics.rmse.toFixed(4));
      console.log('   MAE:', result.metrics.mae.toFixed(4));
      
      // Check if deployed
      const newModel = await ModelVersionModel.findOne({ version: result.version });
      if (newModel.isProduction) {
        console.log();
        console.log('🚀 Model deployed to production!');
      }
    } else {
      console.log('❌ RETRAINING FAILED');
      console.log('   Error:', result.message);
    }
    console.log('='.repeat(60));
    console.log();

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

// Run the script
runRetraining();
