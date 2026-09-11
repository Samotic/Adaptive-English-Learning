import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

(async () => {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
  const db = mongoose.connection.db;
  
  const readingMod = await db.collection('modules').findOne({ title: /Reading/ });
  
  console.log(`\nReading module:\nItems: ${readingMod?.items?.length}`);
  readingMod?.items?.forEach((item, i) => {
    console.log(`  ${i+1}. ${JSON.stringify(item)}`);
  });
  
  await mongoose.disconnect();
})();
