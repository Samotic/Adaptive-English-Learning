import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

(async () => {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
  const db = mongoose.connection.db;
  
  const modules = await db.collection('modules').find({}).toArray();
  
  modules.forEach(mod => {
    console.log(`\n${mod.title}: ${mod.items?.length || 0} items`);
    if (mod.items && mod.items.length > 0) {
      console.log(`  Item 1: ${JSON.stringify(mod.items[0])}`);
    }
  });
  
  await mongoose.disconnect();
})();
