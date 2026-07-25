import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  age: {
    type: Number,
    min: [16, 'Age must be at least 16'],
    max: [100, 'Age must be less than 100'],
  },
  photo: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters'],
  },
  category: {
    type: String,
    enum: ['Miss', 'Mister', 'Teen', 'Face of Eminent'],
  },
  socialMedia: {
    instagram: { type: String, trim: true },
    facebook: { type: String, trim: true },
    twitter: { type: String, trim: true },
    tiktok: { type: String, trim: true },
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'not_required', 'pending'],
    default: 'pending',
  },
  contestantStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  transactionReference: {
    type: String,
    default: null,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  rejectedAt: {
    type: Date,
    default: null,
  },
  adminNotes: {
    type: String,
    maxlength: 500,
  },
});

// No need to add index here since unique: true already creates an index
// userSchema.index({ email: 1 });

export default mongoose.model('User', userSchema);
