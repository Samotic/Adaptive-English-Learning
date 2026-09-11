import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

(async () => {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
  const db = mongoose.connection.db;
  
  const freeTextQs = await db.collection('questions').find({ type: 'free-text' }).limit(3).toArray();
  
  freeTextQs.forEach((q, i) => {
    console.log(`\n${i+1}. Text: ${q.text?.substring(0, 50)}`);
    console.log(`   Type: ${q.type}`);
    console.log(`   Has options: ${!!q.options && q.options.length > 0}`);
    console.log(`   Options count: ${q.options?.length || 0}`);
    console.log(`   Has audioUrl: ${!!q.audioUrl}`);
    console.log(`   EvaluationType: ${q.evaluationType}`);
  });
  
  await mongoose.disconnect();
})();
