import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

(async () => {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
  const db = mongoose.connection.db;
  
  const modules = await db.collection('modules').find({}).toArray();
  const listeningMod = modules.find(m => m.title.includes('Listening'));
  
  console.log('\nListening module - items 7-9:');
  for (let i = 6; i < listeningMod.items.length; i++) {
    const item = listeningMod.items[i];
    const q = await db.collection('questions').findOne({ _id: item.questionId });
    console.log(`\n${i+1}. Type: ${q?.type}`);
    console.log(`   Text: ${q?.text?.substring(0, 60)}`);
    console.log(`   Has options: ${!!q?.options && q?.options.length > 0}`);
    console.log(`   Options: ${q?.options || 'undefined'}`);
    console.log(`   Has audioUrl: ${!!q?.audioUrl}`);
  }
  
  await mongoose.disconnect();
})();
