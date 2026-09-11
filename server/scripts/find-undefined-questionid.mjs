import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

(async () => {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
  const db = mongoose.connection.db;
  
  const mods = await db.collection('modules').find({}).toArray();
  
  mods.forEach(mod => {
    const badItems = mod.items?.filter(it => !it.questionId || it.questionId === 'undefined');
    if (badItems && badItems.length > 0) {
      console.log(`\n❌ ${mod.title} has ${badItems.length} items with undefined questionId`);
      badItems.forEach((it, i) => {
        console.log(`   ${i+1}. ${JSON.stringify(it)}`);
      });
    }
  });
  
  await mongoose.disconnect();
})();
