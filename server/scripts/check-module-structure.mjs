import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

(async () => {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
  const db = mongoose.connection.db;
  
  const modules = await db.collection('modules').find({}).limit(1).toArray();
  
  if (modules.length > 0) {
    console.log('\nFirst module in DB:');
    console.log(JSON.stringify(modules[0], null, 2));
  }
  
  await mongoose.disconnect();
})();
