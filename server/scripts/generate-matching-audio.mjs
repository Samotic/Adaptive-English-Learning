/**
 * Generate TTS audio URLs for questions to match their audioText content
 * Uses Google's TTS API (via a free workaround) or similar service
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

// Simple TTS URL generator - uses a free API
function generateTTSUrl(text, lang = 'en') {
  // Use the RapidAPI Voicerss API pattern (free tier available)
  // Or Google Translate TTS workaround
  const encodedText = encodeURIComponent(text);
  
  // Using Google Translate TTS (direct URL generation)
  // This is a reliable workaround that generates actual audio
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`;
}

async function generateMatchingAudio() {
  console.log('🎵 Generating matching audio for questions...\n');

  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
    console.log('✓ Connected to MongoDB\n');

    // Find all questions with audioText but we want to regenerate proper URLs
    const questions = await mongoose.connection.db.collection('questions').find({
      audioText: { $exists: true, $ne: null },
      audioUrl: { $exists: true, $ne: null }
    }).toArray();

    console.log(`Found ${questions.length} questions with audioText\n`);

    let updated = 0;
    for (const q of questions) {
      try {
        // Generate a proper TTS URL from the audioText
        const ttsUrl = generateTTSUrl(q.audioText, 'en');
        
        // Update the question with the new audio URL
        await mongoose.connection.db.collection('questions').updateOne(
          { _id: q._id },
          { $set: { audioUrl: ttsUrl } }
        );
        
        updated++;
        console.log(`✓ ${updated}. Updated: ${q.text.substring(0, 50)}...`);
      } catch (error) {
        console.error(`✗ Error updating question: ${error.message}`);
      }
    }

    console.log(`\n✅ Successfully updated ${updated} questions with matching audio URLs`);
    console.log('\n💡 Audio URLs now match the audioText content!');
    console.log('   Each question will play the exact text it contains.\n');

    await mongoose.disconnect();
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

generateMatchingAudio();
