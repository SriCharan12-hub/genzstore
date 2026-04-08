import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';

dotenv.config({ path: path.join(__dirname, '../.env') });

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'Admin User';

if (!email || !password) {
  console.error('Usage: npm run create-admin -- email@example.com password "Full Name"');
  process.exit(1);
}

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/genzstore');
    console.log('--- Connected to MongoDB ---');

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`User already exists. Updating to admin...`);
      existingUser.role = 'admin';
      await existingUser.save();
      console.log(`✅ Success! User "${existingUser.name}" (${existingUser.email}) is now an ADMIN.`);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      provider: 'local',
      isVerified: true,
    });

    await user.save();
    console.log(`✅ Success! Admin user "${user.name}" (${user.email}) has been created.`);
    console.log(`\nYou can now login with:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (error: any) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
