import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../src/models/User';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/genzstore');
    console.log('📋 Registered Users:');
    
    const users = await User.find().select('name email role provider isVerified createdAt');
    
    if (users.length === 0) {
      console.log('No users found in database.');
    } else {
      users.forEach((u: any) => {
        console.log(`  - ${u.name} (${u.email}) [${u.role}] via ${u.provider} - Verified: ${u.isVerified}`);
      });
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();
