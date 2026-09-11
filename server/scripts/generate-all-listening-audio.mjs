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

async function generateAllAudioWithText() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: 'english' });
    console.log('✓ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Get all questions with audioText (not just listening, but all skills)
    const questions = await db.collection('questions').find({
      audioText: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`Found ${questions.length} questions with audioText\n`);
    console.log('Generating Text-to-Speech URLs for all...\n');
    
    let updated = 0;
    
    for (const q of questions) {
      const ttsUrl = generateTTSUrl(q.audioText);
      
      if (ttsUrl) {
        await db.collection('questions').updateOne(
          { _id: q._id },
          { $set: { audioUrl: ttsUrl } }
        );
        updated++;
        
        console.log(`✓ Q${updated} (${q.skill}): "${q.text?.substring(0, 50)}..."`);
        console.log(`  Audio: "${q.audioText?.substring(0, 55)}..."`);
        console.log(`  TTS URL generated\n`);
      }
    }
    
    console.log(`✅ Generated TTS URLs for ${updated} questions with audioText`);
    console.log(`\n📝 Note: Audio files are generated on-demand by Google Translate API`);
    console.log(`   First playback may take 1-2 seconds as the audio is generated.`);
    console.log(`\n🎧 All questions with audio content now have text-to-speech audio!`);
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

generateAllAudioWithText();
