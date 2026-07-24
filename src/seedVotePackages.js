import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VotePackage from './models/VotePackage.js';
import { connectDB } from './config/database.js';

dotenv.config();

const votePackages = [
  {
    name: '1 Vote',
    numberOfVotes: 1,
    price: 100,
    currency: 'NGN',
    description: 'Single vote package',
  },
  {
    name: '10 Votes',
    numberOfVotes: 10,
    price: 900,
    currency: 'NGN',
    discount: 10,
    description: 'Get 10% discount on bulk votes',
  },
  {
    name: '50 Votes',
    numberOfVotes: 50,
    price: 4000,
    currency: 'NGN',
    discount: 20,
    description: 'Get 20% discount on bulk votes',
  },
];

const seedVotePackages = async () => {
  try {
    await connectDB();

    // Clear existing packages
    await VotePackage.deleteMany({});
    console.log('🗑️  Cleared existing vote packages');

    // Insert new packages
    const packages = await VotePackage.insertMany(votePackages);
    console.log(`✅ Successfully seeded ${packages.length} vote packages`);

    packages.forEach((pkg) => {
      console.log(`   - ${pkg.name}: ₦${pkg.price} (${pkg.numberOfVotes} votes)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding vote packages:', error);
    process.exit(1);
  }
};

seedVotePackages();
