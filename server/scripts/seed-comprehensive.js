import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { connectMongo } from '../src/db/mongo.js';
import QuestionModel from '../src/models/question.js';
import ModuleModel from '../src/models/module.js';
import UserModel from '../src/models/user.js';
import gamificationService from '../src/services/gamificationService.js';
import { allQuestions, modules } from '../src/data/contentData.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI not found in .env file');
  console.error('Please ensure your .env file has MONGODB_URI defined');
  process.exit(1);
}

/**
 * Comprehensive Database Seeding Script
 * Populates the database with realistic English learning content
 * across all skills: Reading, Writing, Listening, Speaking
 */

async function seedDatabase() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await connectMongo(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await QuestionModel.deleteMany({});
    await ModuleModel.deleteMany({});
    console.log('✅ Cleared existing questions and modules\n');

    // Seed Questions
    console.log('📚 Seeding questions...');
    console.log(`   Total questions to insert: ${allQuestions.length}`);
    
    const insertedQuestions = [];
    for (const question of allQuestions) {
      try {
        const newQuestion = await QuestionModel.create(question);
        insertedQuestions.push(newQuestion);
      } catch (error) {
        console.error(`   ⚠️  Error inserting question: ${question.text.substring(0, 50)}...`);
        console.error(`      Details: ${error.message}`);
      }
    }
    
    console.log(`✅ Inserted ${insertedQuestions.length} questions`);
    console.log(`   - Reading: ${insertedQuestions.filter(q => q.skill === 'reading').length}`);
    console.log(`   - Writing: ${insertedQuestions.filter(q => q.skill === 'writing').length}`);
    console.log(`   - Listening: ${insertedQuestions.filter(q => q.skill === 'listening').length}`);
    console.log(`   - Speaking: ${insertedQuestions.filter(q => q.skill === 'speaking').length}\n`);

    // Seed Modules with questions
    console.log('📦 Seeding modules...');
    
    const modulesBySkill = {
      reading: insertedQuestions.filter(q => q.skill === 'reading'),
      writing: insertedQuestions.filter(q => q.skill === 'writing'),
      listening: insertedQuestions.filter(q => q.skill === 'listening'),
      speaking: insertedQuestions.filter(q => q.skill === 'speaking')
    };

    // Separate free-text questions by skill
    const freeTextBySkill = {
      reading: insertedQuestions.filter(q => q.skill === 'reading' && q.type === 'free-text'),
      writing: insertedQuestions.filter(q => q.skill === 'writing' && q.type === 'free-text')
    };
    let freeTextIndices = { reading: 0, writing: 0 };
    
    console.log(`\n📝 Free-text questions by skill:`);
    console.log(`   Reading: ${freeTextBySkill.reading.length}`);
    console.log(`   Writing: ${freeTextBySkill.writing.length}\n`);

    const insertedModules = [];
    for (const moduleData of modules) {
      const skillQuestions = modulesBySkill[moduleData.skill] || [];
      
      // Assign questions to module based on difficulty
      const moduleDifficulty = moduleData.difficulty;
      const matchingQuestions = skillQuestions.filter(q => {
        const diff = Math.abs(q.difficulty - moduleDifficulty);
        return diff <= 1; // Questions within ±1 difficulty of module
      });

      // Create items for this module, mixing in free-text questions
      const items = [];
      let matchingIndex = 0;
      for (let i = 0; i < 8 && (matchingIndex < matchingQuestions.length || (moduleData.skill === 'reading' || moduleData.skill === 'writing')); i++) {
        let question;
        
        // Alternate between regular and free-text questions
        if (i % 3 === 2 && (moduleData.skill === 'reading' || moduleData.skill === 'writing')) {
          const freeTextList = freeTextBySkill[moduleData.skill] || [];
          if (freeTextList.length > 0) {
            question = freeTextList[freeTextIndices[moduleData.skill] % freeTextList.length];
            freeTextIndices[moduleData.skill]++;
          } else if (matchingIndex < matchingQuestions.length) {
            question = matchingQuestions[matchingIndex++];
          } else {
            continue;
          }
        } else if (matchingIndex < matchingQuestions.length) {
          question = matchingQuestions[matchingIndex++];
        } else if (moduleData.skill === 'reading' || moduleData.skill === 'writing') {
          const freeTextList = freeTextBySkill[moduleData.skill] || [];
          if (freeTextList.length > 0) {
            question = freeTextList[freeTextIndices[moduleData.skill] % freeTextList.length];
            freeTextIndices[moduleData.skill]++;
          } else {
            continue;
          }
        } else {
          continue;
        }

        if (question) {
          items.push({
            title: `Exercise ${items.length + 1}`,
            type: question.type || 'objective',
            difficulty: question.difficulty,
            discrimination: 1,
            questionId: question._id
          });
        }
      }

      const newModule = await ModuleModel.create({
        ...moduleData,
        items
      });

      const freeTextCount = items.filter(it => it.type === 'free-text').length;
      insertedModules.push(newModule);
      console.log(`   ✓ Created module: ${newModule.title} (${items.length} items${freeTextCount > 0 ? `, ${freeTextCount} free-text` : ''})`);
    }

    console.log(`\n✅ Inserted ${insertedModules.length} modules`);
    console.log(`   - Reading: ${insertedModules.filter(m => m.skill === 'reading').length}`);
    console.log(`   - Writing: ${insertedModules.filter(m => m.skill === 'writing').length}`);
    console.log(`   - Listening: ${insertedModules.filter(m => m.skill === 'listening').length}`);
    console.log(`   - Speaking: ${insertedModules.filter(m => m.skill === 'speaking').length}\n`);

    // Create sample users if needed
    console.log('👥 Creating sample users...');
    
    const existingUsers = await UserModel.countDocuments();
    if (existingUsers === 0) {
      const sampleUsers = [
        {
          username: 'student_demo',
          password: 'password123',
          email: 'student@example.com',
          firstName: 'Demo',
          lastName: 'Student',
          role: 'student',
          theta: 0
        },
        {
          username: 'teacher_demo',
          password: 'password123',
          email: 'teacher@example.com',
          firstName: 'Demo',
          lastName: 'Teacher',
          role: 'teacher',
          theta: 0
        },
        {
          username: 'admin_demo',
          password: 'password123',
          email: 'admin@example.com',
          firstName: 'Demo',
          lastName: 'Admin',
          role: 'admin',
          theta: 0
        }
      ];

      for (const userData of sampleUsers) {
        try {
          await UserModel.create(userData);
          console.log(`   ✓ Created user: ${userData.username} (${userData.role})`);
        } catch (error) {
          console.log(`   ⚠️  User ${userData.username} may already exist`);
        }
      }
    } else {
      console.log(`   ℹ️  ${existingUsers} users already exist, skipping user creation\n`);
    }

    console.log('🏅 Initializing badges...');
    await gamificationService.initializeDefaultBadges();

    // Summary
    console.log('\n📊 Seeding Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Questions: ${insertedQuestions.length}`);
    console.log(`✅ Modules: ${insertedModules.length}`);
    console.log(`✅ Users: ${await UserModel.countDocuments()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Statistics by difficulty level
    console.log('📈 Content Distribution by CEFR Level:');
    const levels = {
      'A1 (Beginner)': { min: -3, max: -1 },
      'A2 (Elementary)': { min: -1, max: 0 },
      'B1 (Intermediate)': { min: 0, max: 1 },
      'B2 (Upper-Int)': { min: 1, max: 2 },
      'C1 (Advanced)': { min: 2, max: 3 }
    };

    for (const [level, range] of Object.entries(levels)) {
      const count = insertedQuestions.filter(q => 
        q.difficulty >= range.min && q.difficulty < range.max
      ).length;
      console.log(`   ${level}: ${count} questions`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n💡 Demo Accounts Created:');
    console.log('   Student: student_demo / password123');
    console.log('   Teacher: teacher_demo / password123');
    console.log('   Admin:   admin_demo / password123\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run the seeding
seedDatabase();
