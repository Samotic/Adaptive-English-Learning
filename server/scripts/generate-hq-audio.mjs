import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as ttsService from '../src/services/ttsService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

async function generateHighQualityAudio() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: 'english' });
    console.log('✓ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Get all questions with audioText
    const questions = await db.collection('questions').find({
      audioText: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`Found ${questions.length} questions with audioText\n`);
    console.log('Generating High-Quality TTS URLs...\n');
    
    let updated = 0;
    let failed = 0;
    
    for (const q of questions) {
      try {
        console.log(`Processing Q${updated + 1}: "${q.audioText?.substring(0, 50)}..."`);
        
        const ttsUrl = await ttsService.generateHighQualityTTSUrl(q.audioText);
        
        if (ttsUrl) {
          await db.collection('questions').updateOne(
            { _id: q._id },
            { $set: { audioUrl: ttsUrl } }
          );
          updated++;
          console.log(`  ✅ Generated TTS URL\n`);
        } else {
          failed++;
          console.log(`  ⚠️  Failed to generate URL\n`);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        failed++;
        console.log(`  ❌ Error: ${e.message}\n`);
      }
    }
    
    console.log(`\n✅ Generated high-quality TTS URLs for ${updated} questions`);
    console.log(`⚠️  Failed: ${failed} questions`);
    console.log(`\n📝 Note: Audio files are generated on-demand by Google Translate API`);
    console.log(`   First playback may take 1-2 seconds as the audio is generated.`);
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

generateHighQualityAudio();
