import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Candidate from './models/Candidate.js';
import { connectDB } from './config/database.js';

dotenv.config();

const sampleCandidates = [
  // Miss Category
  {
    name: 'Emma Johnson',
    age: 23,
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    bio: 'Passionate about community service and environmental conservation. Advocate for youth empowerment.',
    category: 'Miss',
  },
  {
    name: 'Sophia Williams',
    age: 22,
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    bio: 'Fashion enthusiast and aspiring model. Believes in the power of confidence and self-love.',
    category: 'Miss',
  },
  {
    name: 'Olivia Brown',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    bio: 'Medical student with a passion for helping others. Dreams of making healthcare accessible to all.',
    category: 'Miss',
  },
  {
    name: 'Ava Davis',
    age: 21,
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    bio: 'Professional dancer and choreographer. Loves expressing emotions through art and movement.',
    category: 'Miss',
  },

  // Mister Category
  {
    name: 'James Anderson',
    age: 25,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    bio: 'Fitness coach and motivational speaker. Dedicated to inspiring others to reach their potential.',
    category: 'Mister',
  },
  {
    name: 'Michael Thomas',
    age: 26,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    bio: 'Entrepreneur and tech innovator. Building solutions for a sustainable future.',
    category: 'Mister',
  },
  {
    name: 'William Martinez',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    bio: 'Professional athlete and sports mentor. Believes in discipline and teamwork.',
    category: 'Mister',
  },
  {
    name: 'Alexander Garcia',
    age: 23,
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
    bio: 'Music producer and songwriter. Creating melodies that touch hearts worldwide.',
    category: 'Mister',
  },

  // Teen Category
  {
    name: 'Isabella Rodriguez',
    age: 17,
    photo: 'https://images.unsplash.com/photo-1581403341630-a6e0b9d2d257?w=400',
    bio: 'Honor student and science enthusiast. Aspiring astronaut with dreams of space exploration.',
    category: 'Teen',
  },
  {
    name: 'Mia Wilson',
    age: 16,
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
    bio: 'Young artist and environmental activist. Fighting for climate action through art.',
    category: 'Teen',
  },
  {
    name: 'Ethan Moore',
    age: 18,
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    bio: 'Tech-savvy student and app developer. Creating digital solutions for everyday problems.',
    category: 'Teen',
  },
  {
    name: 'Noah Taylor',
    age: 17,
    photo: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    bio: 'Basketball player and community volunteer. Leading youth programs in underprivileged areas.',
    category: 'Teen',
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing candidates
    await Candidate.deleteMany({});
    console.log('🗑️  Cleared existing candidates');

    // Insert sample candidates
    const candidates = await Candidate.insertMany(sampleCandidates);
    console.log(`✅ Successfully seeded ${candidates.length} candidates`);

    // Display summary
    const missCandidates = candidates.filter((c) => c.category === 'Miss');
    const misterCandidates = candidates.filter((c) => c.category === 'Mister');
    const teenCandidates = candidates.filter((c) => c.category === 'Teen');

    console.log('\n📊 Summary:');
    console.log(`   Miss: ${missCandidates.length} candidates`);
    console.log(`   Mister: ${misterCandidates.length} candidates`);
    console.log(`   Teen: ${teenCandidates.length} candidates`);
    console.log(`   Total: ${candidates.length} candidates\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
