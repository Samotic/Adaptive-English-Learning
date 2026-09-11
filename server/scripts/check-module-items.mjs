import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

(async () => {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
  const db = mongoose.connection.db;
  
  const modules = await db.collection('modules').find({}).toArray();
  const listeningMod = modules.find(m => m.title.includes('Listening'));
  
  if (listeningMod && listeningMod.items) {
    console.log('Listening module items:');
    for (let i = 0; i < listeningMod.items.length; i++) {
      const item = listeningMod.items[i];
      const q = await db.collection('questions').findOne({ _id: item.questionId });
      console.log(`  ${i+1}. Type: ${q?.type}, HasAudio: ${!!q?.audioUrl}, Text: ${q?.text?.substring(0, 50)}`);
    }
  }
  
  await mongoose.disconnect();
})();
