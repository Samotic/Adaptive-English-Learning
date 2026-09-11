import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

/**
 * Generate Text-to-Speech URLs using Google Translate API
 * Format: https://translate.google.com/translate_tts?ie=UTF-8&q=<text>&tl=en&client=tw-ob
 */
function generateTTSUrl(text) {
  if (!text) return null;
  
  // Encode the text for URL
  const encoded = encodeURIComponent(text);
  
  // Use Google Translate TTS (no auth required)
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=en&client=tw-ob&ttsspeed=0.5`;
}

async function generateTTSAudio() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
    console.log('✓ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Get all questions with audioText
    const questions = await db.collection('questions').find({
      audioText: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`Found ${questions.length} questions with audioText`);
    console.log('Generating Text-to-Speech URLs...\n');
    
    let updated = 0;
    
    for (const q of questions) {
      const ttsUrl = generateTTSUrl(q.audioText);
      
      if (ttsUrl) {
        await db.collection('questions').updateOne(
          { _id: q._id },
          { $set: { audioUrl: ttsUrl } }
        );
        updated++;
        
        console.log(`✓ "${q.audioText?.substring(0, 55)}..."`);
        console.log(`  → TTS URL generated\n`);
      }
    }
    
    // Also update any multiple-choice listening questions with audioText but no audioUrl
    const mcQuestions = await db.collection('questions').find({
      type: 'multiple-choice',
      skill: 'listening',
      audioText: { $exists: true, $ne: null },
      $or: [
        { audioUrl: { $exists: false } },
        { audioUrl: null }
      ]
    }).toArray();
    
    console.log(`\nFound ${mcQuestions.length} multiple-choice listening questions to update`);
    
    for (const q of mcQuestions) {
      const ttsUrl = generateTTSUrl(q.audioText);
      
      if (ttsUrl) {
        await db.collection('questions').updateOne(
          { _id: q._id },
          { $set: { audioUrl: ttsUrl } }
        );
        updated++;
        
        console.log(`✓ "${q.audioText?.substring(0, 55)}..."`);
        console.log(`  → TTS URL generated\n`);
      }
    }
    
    console.log(`\n✅ Generated TTS URLs for ${updated} questions`);
    console.log('\n📝 Note: Audio files are generated on-demand by Google Translate API');
    console.log('   First playback may take 1-2 seconds as the audio is generated.');
    
    await mongoose.disconnect();
    
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

generateTTSAudio();
