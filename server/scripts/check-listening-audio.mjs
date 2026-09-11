import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

(async () => {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
  const db = mongoose.connection.db;
  
  const modules = await db.collection('modules').find({}).toArray();
  const listeningMod = modules.find(m => m.title.includes('Listening'));
  
  console.log('\nListening module questions and their audio URLs:\n');
  
  if (listeningMod?.items) {
    for (let i = 0; i < listeningMod.items.length; i++) {
      const q = await db.collection('questions').findOne({ _id: listeningMod.items[i].questionId });
      console.log(`${i+1}. ${q?.text?.substring(0, 40)}`);
      console.log(`   Type: ${q?.type}`);
      console.log(`   AudioUrl: ${q?.audioUrl?.substring(0, 50)}...`);
      console.log(`   AudioText: ${q?.audioText?.substring(0, 40)}\n`);
    }
  }
  
  await mongoose.disconnect();
})();
