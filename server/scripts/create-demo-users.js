import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { connectMongo } from '../src/db/mongo.js';
import UserModel from '../src/models/user.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function createDemoUsers() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await connectMongo(MONGODB_URI);
    console.log('✅ Connected\n');

    // Delete existing demo users if they exist
    console.log('🗑️  Removing old demo users...');
    await UserModel.deleteMany({
      username: { $in: ['admin_demo', 'teacher_demo', 'student_demo'] }
    });
    console.log('✅ Old demo users removed\n');

    // Create demo users with plain passwords (will be hashed by pre-save hook)
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

    console.log('👥 Creating demo users...');
    for (const userData of sampleUsers) {
      const user = await UserModel.create(userData);
      console.log(`   ✓ Created user: ${user.username} (${user.role})`);
    }

    console.log('\n💡 Demo Accounts Created:');
    console.log('   Student: student_demo / password123');
    console.log('   Teacher: teacher_demo / password123');
    console.log('   Admin:   admin_demo / password123\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
}

createDemoUsers();
