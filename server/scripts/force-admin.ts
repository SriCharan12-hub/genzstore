import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../src/models/User';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function forceAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/genzstore');
    console.log('--- Connected to MongoDB ---');

    // Update the user role to admin
    const result = await User.findOneAndUpdate(
      { email: 'sric6618@gmail.com' },
      { role: 'admin' },
      { new: true, returnDocument: 'after' }
    );

    if (!result) {
      console.error('User not found');
      process.exit(1);
    }

    console.log(`✅ User updated successfully!`);
    console.log(`Name: ${result.name}`);
    console.log(`Email: ${result.email}`);
    console.log(`Role: ${result.role}`);
    console.log(`Provider: ${result.provider}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

forceAdmin();
