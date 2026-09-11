import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

(async () => {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
  const db = mongoose.connection.db;
  
  const withAudio = await db.collection('questions').find({ 
    audioUrl: { $exists: true, $ne: null } 
  }).limit(5).toArray();
  
  console.log('\nQuestions with audio URLs:');
  withAudio.forEach((q, i) => {
    console.log(`${i+1}. ${q.type} - ${q.text?.substring(0, 50)}`);
    console.log(`   URL: ${q.audioUrl}`);
  });
  
  await mongoose.disconnect();
})();
