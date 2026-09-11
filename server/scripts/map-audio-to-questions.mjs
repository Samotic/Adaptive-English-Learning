import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

// Map audio keywords to URLs (using free/public domain audio from various sources)
const audioLibrary = {
  // Weather/nature sounds
  'weather|sunny|rain|cloudy': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  
  // Business/work
  'work|restaurant|job|office': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  
  // Time/schedules  
  'time|close|morning|afternoon': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  
  // People/relationships
  'family|friend|name|person|people': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  
  // Objects/items
  'cat|dog|animal|pet|fruit|apple|orange': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  
  // Abstract/learning
  'learning|subject|school|education|science': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  
  // Transport/location
  'bus|car|travel|location|city': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  
  // Food/drink
  'drink|juice|water|tea|milk|bread|food': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  
  // General/fallback
  'default': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
};

function findBestAudioUrl(text) {
  if (!text) return audioLibrary.default;
  
  const lowerText = text.toLowerCase();
  
  for (const [keywords, url] of Object.entries(audioLibrary)) {
    if (keywords === 'default') continue;
    
    const keywordList = keywords.split('|');
    for (const keyword of keywordList) {
      if (lowerText.includes(keyword)) {
        return url;
      }
    }
  }
  
  return audioLibrary.default;
}

async function mapAudioToQuestions() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
    console.log('✓ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Get all questions with audioText
    const questionsWithAudioText = await db.collection('questions').find({
      audioText: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`Found ${questionsWithAudioText.length} questions with audioText\n`);
    console.log('Mapping audio URLs to match question content...\n');
    
    let updated = 0;
    
    for (const q of questionsWithAudioText) {
      const bestUrl = findBestAudioUrl(q.audioText);
      
      if (!q.audioUrl || q.audioUrl.includes('soundhelix')) {
        // Only update if not already set or if it's a generic soundhelix URL
        await db.collection('questions').updateOne(
          { _id: q._id },
          { $set: { audioUrl: bestUrl } }
        );
        updated++;
        
        console.log(`✓ Updated: "${q.audioText?.substring(0, 50)}..."`);
        console.log(`  → ${bestUrl.split('/').pop()}\n`);
      }
    }
    
    console.log(`\n✅ Updated ${updated} questions with matching audio URLs`);
    await mongoose.disconnect();
    
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

mapAudioToQuestions();
