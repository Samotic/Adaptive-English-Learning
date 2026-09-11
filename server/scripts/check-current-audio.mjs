import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

(async () => {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
  const db = mongoose.connection.db;
  
  const qs = await db.collection('questions').find({
    audioUrl: { $exists: true, $ne: null }
  }).limit(5).toArray();
  
  console.log('\nCurrent audio URLs in database:\n');
  qs.forEach((q, i) => {
    console.log(`${i+1}. ${q.audioText?.substring(0, 40) || 'N/A'}`);
    console.log(`   URL: ${q.audioUrl}\n`);
  });
  
  await mongoose.disconnect();
})();
