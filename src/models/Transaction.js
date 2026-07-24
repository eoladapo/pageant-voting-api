import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  purpose: {
    type: String,
    enum: ['registration_fee', 'vote_purchase'],
    required: true,
    default: 'vote_purchase',
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: function () {
      return this.purpose === 'vote_purchase';
    },
  },
  numberOfVotes: {
    type: Number,
    required: function () {
      return this.purpose === 'vote_purchase';
    },
    min: 1,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['paystack', 'flutterwave', 'bank_transfer'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'successful', 'failed', 'cancelled'],
    default: 'pending',
  },
  paymentReference: {
    type: String,
    unique: true,
    sparse: true,
  },
  paymentGatewayReference: {
    type: String,
    unique: true,
    sparse: true,
  },
  votesApplied: {
    type: Boolean,
    default: false,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
transactionSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

// Index for faster queries
transactionSchema.index({ email: 1 });
transactionSchema.index({ candidateId: 1 });
transactionSchema.index({ paymentStatus: 1 });

export default mongoose.model('Transaction', transactionSchema);
