import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../src/models/User';

dotenv.config({ path: path.join(__dirname, '../.env') });

const email = process.argv[2];

if (!email) {
  console.error('Usage: npm run set-admin -- your-email@gmail.com');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genzstore';

async function setAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('--- Connected to MongoDB ---');

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      console.error(`User with email "${email}" not found in database.`);
      process.exit(1);
    }

    console.log(`✅ Success! User "${user.name}" (${user.email}) is now an ADMIN.`);
    process.exit(0);
  } catch (error: any) {
    console.error('Error setting admin:', error.message);
    process.exit(1);
  }
}

setAdmin();
