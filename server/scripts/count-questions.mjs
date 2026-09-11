import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

async function countQuestions() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: 'english' });
    
    const db = mongoose.connection.db;
    const total = await db.collection('questions').countDocuments();
    const withAudioText = await db.collection('questions').countDocuments({ audioText: { $exists: true, $ne: null } });
    const withAudioUrl = await db.collection('questions').countDocuments({ audioUrl: { $exists: true, $ne: null } });
    
    console.log('Total questions:', total);
    console.log('Questions with audioText:', withAudioText);
    console.log('Questions with audioUrl:', withAudioUrl);
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

countQuestions();
