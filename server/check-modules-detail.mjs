import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkModules() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
    const db = mongoose.connection.db;
    
    const modules = await db.collection('modules').find({}).limit(4).toArray();
    
    console.log('\n=== MODULE ITEMS DETAIL ===\n');
    for (const mod of modules) {
      console.log(`Module: ${mod.title}`);
      console.log(`  Total items: ${mod.items?.length || 0}`);
      
      if (mod.items && mod.items.length > 0) {
        for (let i = 0; i < Math.min(3, mod.items.length); i++) {
          const item = mod.items[i];
          console.log(`    Item ${i+1}: type=${item.type}, questionId=${item.questionId}`);
        }
      }
      console.log('');
    }
    
    await mongoose.connection.close();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkModules();
