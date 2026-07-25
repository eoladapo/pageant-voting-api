import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for backward compatibility
    default: null,
  },
  name: {
    type: String,
    required: [true, 'Candidate name is required'],
    trim: true,
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [16, 'Age must be at least 16'],
    max: [100, 'Age must be less than 100'],
  },
  photo: {
    type: String,
    required: [true, 'Photo URL is required'],
    trim: true,
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Miss', 'Mister', 'Teen', 'Face of Eminent'],
  },
  socialMedia: {
    instagram: { type: String, trim: true },
    facebook: { type: String, trim: true },
    twitter: { type: String, trim: true },
    tiktok: { type: String, trim: true },
  },
  votes: {
    type: Number,
    default: 0,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Instance method to increment votes
candidateSchema.methods.incrementVotes = async function () {
  this.votes += 1;
  await this.save();
  return this.votes;
};

// Static method to get candidates by category with vote counts
candidateSchema.statics.getByCategory = async function (category) {
  return await this.find({ category }).sort({ votes: -1 });
};

export default mongoose.model('Candidate', candidateSchema);
