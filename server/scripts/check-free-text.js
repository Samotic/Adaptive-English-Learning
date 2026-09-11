import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

async function checkFreeText() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
    const db = mongoose.connection.db;
    
    // Find all free-text/essay questions
    const freeText = await db.collection('questions').find({ 
      $or: [
        { type: 'free-text' },
        { type: 'essay' },
        { evaluationType: 'semantic' }
      ]
    }).toArray();
    
    console.log(`\n=== FREE TEXT / ESSAY QUESTIONS (${freeText.length}) ===\n`);
    freeText.slice(0, 5).forEach((q, i) => {
      console.log(`${i + 1}. Type: ${q.type}, Text: ${q.text?.substring(0, 60)}...`);
    });
    
    // Check modules for essay questions
    const modules = await db.collection('modules').find({}).toArray();
    console.log(`\n=== MODULES AND THEIR QUESTION TYPES ===\n`);
    
    for (const mod of modules) {
      console.log(`Module: ${mod.title}`);
      if (mod.items && mod.items.length > 0) {
        const types = {};
        for (const item of mod.items) {
          const q = await db.collection('questions').findOne({ _id: item.questionId });
          types[q?.type] = (types[q?.type] || 0) + 1;
        }
        console.log(`  Question types: ${JSON.stringify(types)}`);
      }
      console.log();
    }
    
    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
  }
}

checkFreeText();
