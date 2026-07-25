import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import AppSettings from './models/AppSettings.js';
import { connectDB } from './config/database.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    // Create first admin
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });

    if (!existingAdmin) {
      const admin = await Admin.create({
        email: process.env.ADMIN_EMAIL || 'admin@pageant.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        name: 'Admin User',
        role: 'admin',
      });

      console.log('✅ Admin created successfully');
      console.log('Email:', admin.email);
      console.log('Password:', process.env.ADMIN_PASSWORD || 'admin123');
    } else {
      console.log('ℹ️  Admin already exists:', existingAdmin.email);
    }

    // Create second admin
    if (process.env.ADMIN_EMAIL_2 && process.env.ADMIN_PASSWORD_2) {
      const existingAdmin2 = await Admin.findOne({ email: process.env.ADMIN_EMAIL_2 });

      if (!existingAdmin2) {
        const admin2 = await Admin.create({
          email: process.env.ADMIN_EMAIL_2,
          password: process.env.ADMIN_PASSWORD_2,
          name: 'Super Admin',
          role: 'admin',
        });

        console.log('✅ Second admin created successfully');
        console.log('Email:', admin2.email);
        console.log('Password:', process.env.ADMIN_PASSWORD_2);
      } else {
        console.log('ℹ️  Second admin already exists:', existingAdmin2.email);
      }
    }

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

    console.log('\n📋 Admin Accounts:');
    console.log('1. Email:', process.env.ADMIN_EMAIL || 'admin@pageant.com');
    console.log('   Password:', process.env.ADMIN_PASSWORD || 'admin123');
    if (process.env.ADMIN_EMAIL_2) {
      console.log('2. Email:', process.env.ADMIN_EMAIL_2);
      console.log('   Password:', process.env.ADMIN_PASSWORD_2);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
