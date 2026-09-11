import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

(async () => {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
  const db = mongoose.connection.db;
  
  const freeTextWithAudio = await db.collection('questions').find({ 
    type: 'free-text',
    audioUrl: { $exists: true, $ne: null } 
  }).limit(5).toArray();
  
  console.log(`\nFree-text questions with audio: ${freeTextWithAudio.length}`);
  freeTextWithAudio.forEach((q, i) => {
    console.log(`\n${i+1}. ${q.text?.substring(0, 60)}`);
    console.log(`   audioUrl: ${q.audioUrl}`);
    console.log(`   audioText: ${q.audioText?.substring(0, 50) || 'none'}`);
  });
  
  await mongoose.disconnect();
})();
