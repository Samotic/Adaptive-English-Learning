#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english-learning';

async function debugDB() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Get database stats
    console.log('=== DATABASE STATE ===\n');
    
    // Count questions by type
    const qCount = await db.collection('questions').countDocuments();
    const qWithAudio = await db.collection('questions').countDocuments({ audioUrl: { $exists: true, $ne: null } });
    console.log('Questions:');
    console.log(`  Total: ${qCount}`);
    console.log(`  With audio: ${qWithAudio}`);
    
    // Get question types
    const types = await db.collection('questions').distinct('type');
    console.log(`  Types: ${types.join(', ')}`);
    
    // Sample a question with audio
    const audioQ = await db.collection('questions').findOne({ audioUrl: { $exists: true, $ne: null } });
    if (audioQ) {
      console.log('\nSample question with audio:');
      console.log(`  ID: ${audioQ._id}`);
      console.log(`  Text: ${audioQ.text.substring(0, 60)}...`);
      console.log(`  AudioUrl: ${audioQ.audioUrl}`);
      console.log(`  Type: ${audioQ.type}`);
      console.log(`  Skill: ${audioQ.skill}`);
    }
    
    // Check modules
    console.log('\n\nModules:');
    const mods = await db.collection('modules').find({}).toArray();
    console.log(`  Total: ${mods.length}`);
    
    for (const mod of mods.slice(0, 3)) {
      console.log(`\n  ${mod.title}:`);
      console.log(`    Items: ${mod.items ? mod.items.length : 0}`);
      
      if (mod.items && mod.items[0]) {
        const qId = mod.items[0].questionId;
        console.log(`    First item questionId: ${qId}`);
        
        // Try to find this question
        try {
          const q = await db.collection('questions').findOne({ _id: new mongoose.Types.ObjectId(qId) });
          if (q) {
            console.log(`      ✓ Question exists`);
            console.log(`      Text: ${q.text.substring(0, 50)}...`);
            console.log(`      Has audioUrl: ${q.audioUrl ? 'YES' : 'NO'}`);
          } else {
            console.log(`      ✗ Question NOT FOUND`);
          }
        } catch (e) {
          console.log(`      Error fetching question: ${e.message}`);
        }
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

debugDB();
