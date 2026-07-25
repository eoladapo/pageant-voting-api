import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true,
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Miss', 'Mister', 'Teen', 'Face of Eminent'],
  },
  numberOfVotes: {
    type: Number,
    required: true,
    min: 1,
  },
  voterEmail: {
    type: String,
    required: true,
  },
  voterName: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for analytics
voteSchema.index({ candidateId: 1 });
voteSchema.index({ category: 1 });
voteSchema.index({ voterEmail: 1 });

export default mongoose.model('Vote', voteSchema);
