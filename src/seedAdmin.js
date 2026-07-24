import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import AppSettings from './models/AppSettings.js';
import { connectDB } from './config/database.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });

    if (existingAdmin) {
      console.log('❌ Admin already exists');
      process.exit(0);
    }

    // Create admin
    const admin = await Admin.create({
      email: process.env.ADMIN_EMAIL || 'admin@pageant.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      name: 'Admin User',
      role: 'admin',
    });

    console.log('✅ Admin created successfully');
    console.log('Email:', admin.email);
    console.log('Password:', process.env.ADMIN_PASSWORD || 'admin123');

    // Create default app settings
    const existingSettings = await AppSettings.findOne();
    if (!existingSettings) {
      await AppSettings.create({
        requirePaymentBeforeRegistration: process.env.REQUIRE_PAYMENT_BEFORE_REGISTRATION === 'true',
        registrationFee: parseFloat(process.env.REGISTRATION_FEE) || 5000,
        votingEnabled: true,
        registrationEnabled: true,
        pricePerVote: parseFloat(process.env.PRICE_PER_VOTE) || 100,
      });
      console.log('✅ Default app settings created');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
