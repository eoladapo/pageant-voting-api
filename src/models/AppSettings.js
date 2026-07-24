import mongoose from 'mongoose';

const appSettingsSchema = new mongoose.Schema({
  requirePaymentBeforeRegistration: {
    type: Boolean,
    default: false,
  },
  registrationFee: {
    type: Number,
    default: 5000,
    min: 0,
  },
  votingEnabled: {
    type: Boolean,
    default: true,
  },
  registrationEnabled: {
    type: Boolean,
    default: true,
  },
  pricePerVote: {
    type: Number,
    default: 100,
    min: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Only allow one settings document
appSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

appSettingsSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

export default mongoose.model('AppSettings', appSettingsSchema);
