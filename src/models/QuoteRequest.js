import mongoose from 'mongoose';

const quoteRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    service: {
      type: String,
      required: true,
      enum: [
        'Videography & Film',
        'Editorial & Cover Features',
        'Branding & Printing',
        'PR & Advertising',
        'Pageant Production',
        'Ushering & Talent',
      ],
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'read', 'quoted', 'archived'],
      default: 'new',
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

const QuoteRequest = mongoose.model('QuoteRequest', quoteRequestSchema);

export default QuoteRequest;
