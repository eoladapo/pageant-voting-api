import User from '../models/User.js';
import AppSettings from '../models/AppSettings.js';
import Transaction from '../models/Transaction.js';
import ContactMessage from '../models/ContactMessage.js';
import QuoteRequest from '../models/QuoteRequest.js';

/**
 * @desc    Get registration settings
 * @route   GET /api/users/registration/settings
 * @access  Public
 */
export const getRegistrationSettings = async (req, res) => {
  try {
    const settings = await AppSettings.getSettings();

    res.status(200).json({
      success: true,
      data: {
        requirePaymentBeforeRegistration: settings.requirePaymentBeforeRegistration,
        registrationFee: settings.registrationFee,
        registrationEnabled: settings.registrationEnabled,
        votingEnabled: settings.votingEnabled,
      },
    });
  } catch (error) {
    console.error('Error fetching registration settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registration settings',
    });
  }
};

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      age,
      category,
      bio,
      socialMedia,
      transactionReference,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and phone',
      });
    }

    // Check settings
    const settings = await AppSettings.getSettings();

    if (!settings.registrationEnabled) {
      return res.status(403).json({
        success: false,
        error: 'Registration is currently closed',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
      });
    }

    // Determine payment status
    let paymentStatus = 'not_required';
    let validatedTransaction = null;

    if (settings.requirePaymentBeforeRegistration) {
      if (!transactionReference) {
        return res.status(400).json({
          success: false,
          error: 'Payment is required before registration. Please complete payment first.',
        });
      }

      // Verify transaction
      validatedTransaction = await Transaction.findOne({
        paymentReference: transactionReference,
        purpose: 'registration_fee',
        paymentStatus: 'successful',
      });

      if (!validatedTransaction) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or unsuccessful payment reference',
        });
      }

      // Check if transaction is already used
      const transactionUsed = await User.findOne({ transactionReference });
      if (transactionUsed) {
        return res.status(400).json({
          success: false,
          error: 'This payment reference has already been used',
        });
      }

      paymentStatus = 'paid';
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      age,
      category,
      bio,
      socialMedia,
      paymentStatus,
      transactionReference: transactionReference || null,
      contestantStatus: 'pending',
    });

    // Link transaction to user if exists
    if (validatedTransaction) {
      validatedTransaction.userId = user._id;
      await validatedTransaction.save();
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your application is pending admin approval.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        contestantStatus: user.contestantStatus,
        paymentStatus: user.paymentStatus,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message,
    });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Public
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
};

/**
 * @desc    Submit contact form message
 * @route   POST /api/users/contact
 * @access  Public
 */
export const submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: name, email, subject, and message',
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address',
      });
    }

    // Validate subject
    const validSubjects = [
      'Booking / Quote',
      'Press / Media',
      'Modeling Academy',
      'Pageant enquiry',
      'Partnerships',
      'Other',
    ];

    if (!validSubjects.includes(subject)) {
      return res.status(400).json({
        success: false,
        error: 'Please select a valid subject',
      });
    }

    // Validate message length
    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Message must be at least 10 characters long',
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Message cannot exceed 2000 characters',
      });
    }

    // Create contact message
    const contactMessage = await ContactMessage.create({
      name,
      email: email.toLowerCase(),
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.',
      data: {
        id: contactMessage._id,
        name: contactMessage.name,
        email: contactMessage.email,
        subject: contactMessage.subject,
        createdAt: contactMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: error.message,
    });
  }
};

/**
 * @desc    Submit quote request
 * @route   POST /api/users/quote
 * @access  Public
 */
export const submitQuoteRequest = async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    if (!name || !email || !phone || !service || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields',
      });
    }

    const quoteRequest = await QuoteRequest.create({
      name,
      email: email.toLowerCase(),
      phone,
      service,
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully!',
      data: {
        id: quoteRequest._id,
      },
    });
  } catch (error) {
    console.error('Quote request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit quote request',
    });
  }
};
