import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'english' });
    
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}, { projection: { username: 1, email: 1, role: 1 } }).toArray();
    
    console.log('Users in database:');
    if (users.length === 0) {
      console.log('  (no users found)');
    } else {
      users.forEach(u => console.log(`  - ${u.username} (${u.role})`));
    }
    
    console.log(`\nTotal: ${users.length} users`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkUsers();
