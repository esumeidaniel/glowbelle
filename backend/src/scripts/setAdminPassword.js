import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

const email = String(process.env.ADMIN_EMAIL || process.argv[2] || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || process.argv[3] || '');

if (!email || !password) {
  console.error('Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=new-password npm run admin:password');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Admin password must be at least 8 characters.');
  process.exit(1);
}

try {
  await connectDB();
  const admin = await User.findOne({ email, role: 'admin' }).select('+password');
  if (!admin) {
    console.error(`No admin account found for ${email}.`);
    process.exitCode = 1;
  } else {
    admin.password = password;
    admin.emailVerified = true;
    admin.status = 'active';
    await admin.save();
    console.log(`Admin password updated for ${admin.email}.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}
