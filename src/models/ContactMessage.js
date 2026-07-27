import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    subject: {
      type: String,
      required: [true, 'Please select a subject'],
      enum: [
        'Booking / Quote',
        'Press / Media',
        'Modeling Academy',
        'Pageant enquiry',
        'Partnerships',
        'Other',
      ],
    },
    message: {
      type: String,
      required: [true, 'Please provide a message'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    repliedAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ email: 1 });

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

export default ContactMessage;
