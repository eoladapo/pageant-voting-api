import Transaction from '../models/Transaction.js';
import Candidate from '../models/Candidate.js';
import VotePackage from '../models/VotePackage.js';
import AppSettings from '../models/AppSettings.js';
import paystackService from '../services/paystackService.js';
import flutterwaveService from '../services/flutterwaveService.js';
import crypto from 'crypto';

// ═══════════════════════════════════════════
// INITIALIZE REGISTRATION PAYMENT
// ═══════════════════════════════════════════
export const initializeRegistrationPayment = async (req, res) => {
  try {
    const { fullName, email, phone, paymentMethod } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Get registration fee from settings
    const settings = await AppSettings.getSettings();
    const amount = settings.registrationFee;

    // Generate unique reference
    const reference = `REG-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create transaction record
    const transaction = await Transaction.create({
      fullName,
      email,
      phone,
      amount,
      paymentMethod,
      paymentReference: reference,
      paymentStatus: 'pending',
      purpose: 'registration_fee',
    });

    // Initialize payment based on method
    let paymentData;
    const callbackUrl = `${process.env.CLIENT_URL}/register?reference=${reference}&verified=true`;

    if (paymentMethod === 'paystack') {
      paymentData = await paystackService.initializePayment({
        email,
        amount,
        reference,
        fullName,
        phone,
        callbackUrl,
        metadata: {
          purpose: 'registration_fee',
        },
      });

      // Update transaction with gateway reference
      transaction.paymentGatewayReference = paymentData.data.reference;
      await transaction.save();

      return res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          authorizationUrl: paymentData.data.authorization_url,
          accessCode: paymentData.data.access_code,
          reference: paymentData.data.reference,
        },
      });
    } else if (paymentMethod === 'flutterwave') {
      paymentData = await flutterwaveService.initializePayment({
        email,
        amount,
        reference,
        fullName,
        phone,
        callbackUrl,
        metadata: {
          purpose: 'registration_fee',
        },
      });

      // Update transaction with gateway reference
      transaction.paymentGatewayReference = paymentData.data.id;
      await transaction.save();

      return res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          paymentLink: paymentData.data.link,
          reference: reference,
        },
      });
    } else if (paymentMethod === 'bank_transfer') {
      // For bank transfer, return bank details
      return res.status(200).json({
        success: true,
        message: 'Bank transfer details',
        data: {
          reference,
          amount,
          bankDetails: {
            bankName: process.env.BANK_NAME || 'Your Bank Name',
            accountNumber: process.env.ACCOUNT_NUMBER || '1234567890',
            accountName: process.env.ACCOUNT_NAME || 'Pageant Voting Account',
          },
          instructions:
            'Please make payment to the account above and send proof of payment to complete your registration.',
        },
      });
    }
  } catch (error) {
    console.error('Initialize registration payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize payment',
    });
  }
};

/**
 * Verify registration payment
 * @route GET /api/payments/registration/verify
 */
export const verifyRegistrationPayment = async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required',
      });
    }

    // Find transaction
    const transaction = await Transaction.findOne({
      paymentReference: reference,
      purpose: 'registration_fee'
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // If already verified
    if (transaction.paymentStatus === 'successful') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        data: {
          transaction,
          reference: transaction.paymentReference,
        },
      });
    }

    let verificationData;

    // Verify payment based on method
    if (transaction.paymentMethod === 'paystack') {
      verificationData = await paystackService.verifyPayment(reference);

      if (verificationData.data.status === 'success') {
        transaction.paymentStatus = 'successful';
        transaction.metadata = verificationData.data;
        await transaction.save();

        return res.status(200).json({
          success: true,
          message: 'Payment verified successfully. You can now complete your registration.',
          data: {
            transaction,
            reference: transaction.paymentReference,
          },
        });
      } else {
        transaction.paymentStatus = 'failed';
        await transaction.save();

        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
        });
      }
    } else if (transaction.paymentMethod === 'flutterwave') {
      verificationData = await flutterwaveService.verifyPayment(
        transaction.paymentGatewayReference
      );

      if (
        verificationData.data.status === 'successful' &&
        verificationData.data.amount >= transaction.amount
      ) {
        transaction.paymentStatus = 'successful';
        transaction.metadata = verificationData.data;
        await transaction.save();

        return res.status(200).json({
          success: true,
          message: 'Payment verified successfully. You can now complete your registration.',
          data: {
            transaction,
            reference: transaction.paymentReference,
          },
        });
      } else {
        transaction.paymentStatus = 'failed';
        await transaction.save();

        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
        });
      }
    }
  } catch (error) {
    console.error('Verify registration payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment',
    });
  }
};

// ═══════════════════════════════════════════
// INITIALIZE PAYMENT
// ═══════════════════════════════════════════
export const initializePayment = async (req, res) => {
  try {
    const { fullName, email, phone, candidateId, numberOfVotes, paymentMethod } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !candidateId || !numberOfVotes || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Check if candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    // Get vote package or calculate price
    const pricePerVote = parseFloat(process.env.PRICE_PER_VOTE) || 100;
    const amount = numberOfVotes * pricePerVote;

    // Generate unique reference
    const reference = `PGV-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create transaction record
    const transaction = await Transaction.create({
      fullName,
      email,
      phone,
      candidateId,
      numberOfVotes,
      amount,
      paymentMethod,
      paymentReference: reference,
      paymentStatus: 'pending',
      purpose: 'vote_purchase',
    });

    // Initialize payment based on method
    let paymentData;
    const callbackUrl = `${process.env.CLIENT_URL}/payment/verify?reference=${reference}`;

    if (paymentMethod === 'paystack') {
      paymentData = await paystackService.initializePayment({
        email,
        amount,
        reference,
        fullName,
        phone,
        candidateId,
        numberOfVotes,
        callbackUrl,
      });

      // Update transaction with gateway reference
      transaction.paymentGatewayReference = paymentData.data.reference;
      await transaction.save();

      return res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          authorizationUrl: paymentData.data.authorization_url,
          accessCode: paymentData.data.access_code,
          reference: paymentData.data.reference,
        },
      });
    } else if (paymentMethod === 'flutterwave') {
      paymentData = await flutterwaveService.initializePayment({
        email,
        amount,
        reference,
        fullName,
        phone,
        candidateId,
        numberOfVotes,
        callbackUrl,
      });

      // Update transaction with gateway reference
      transaction.paymentGatewayReference = paymentData.data.id;
      await transaction.save();

      return res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          paymentLink: paymentData.data.link,
          reference: reference,
        },
      });
    } else if (paymentMethod === 'bank_transfer') {
      // For bank transfer, return bank details
      return res.status(200).json({
        success: true,
        message: 'Bank transfer details',
        data: {
          reference,
          amount,
          bankDetails: {
            bankName: process.env.BANK_NAME || 'Your Bank Name',
            accountNumber: process.env.ACCOUNT_NUMBER || '1234567890',
            accountName: process.env.ACCOUNT_NAME || 'Pageant Voting Account',
          },
          instructions:
            'Please make payment to the account above and send proof of payment to complete your vote purchase.',
        },
      });
    }
  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize payment',
    });
  }
};

// ═══════════════════════════════════════════
// VERIFY PAYMENT
// ═══════════════════════════════════════════
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required',
      });
    }

    // Find transaction
    const transaction = await Transaction.findOne({ paymentReference: reference }).populate(
      'candidateId'
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // If already verified and votes applied
    if (transaction.paymentStatus === 'successful' && transaction.votesApplied) {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        data: {
          transaction,
          candidate: transaction.candidateId,
        },
      });
    }

    let verificationData;

    // Verify payment based on method
    if (transaction.paymentMethod === 'paystack') {
      verificationData = await paystackService.verifyPayment(reference);

      if (verificationData.data.status === 'success') {
        // Update transaction
        transaction.paymentStatus = 'successful';
        transaction.votesApplied = true;
        transaction.metadata = verificationData.data;
        await transaction.save();

        // Apply votes to candidate
        const candidate = await Candidate.findById(transaction.candidateId);
        candidate.votes += transaction.numberOfVotes;
        await candidate.save();

        return res.status(200).json({
          success: true,
          message: 'Payment verified successfully',
          data: {
            transaction,
            candidate,
          },
        });
      } else {
        transaction.paymentStatus = 'failed';
        await transaction.save();

        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
        });
      }
    } else if (transaction.paymentMethod === 'flutterwave') {
      verificationData = await flutterwaveService.verifyPayment(
        transaction.paymentGatewayReference
      );

      if (
        verificationData.data.status === 'successful' &&
        verificationData.data.amount >= transaction.amount
      ) {
        // Update transaction
        transaction.paymentStatus = 'successful';
        transaction.votesApplied = true;
        transaction.metadata = verificationData.data;
        await transaction.save();

        // Apply votes to candidate
        const candidate = await Candidate.findById(transaction.candidateId);
        candidate.votes += transaction.numberOfVotes;
        await candidate.save();

        return res.status(200).json({
          success: true,
          message: 'Payment verified successfully',
          data: {
            transaction,
            candidate,
          },
        });
      } else {
        transaction.paymentStatus = 'failed';
        await transaction.save();

        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
        });
      }
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment',
    });
  }
};

// ═══════════════════════════════════════════
// WEBHOOK HANDLER FOR PAYSTACK
// ═══════════════════════════════════════════
export const paystackWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

    if (hash === req.headers['x-paystack-signature']) {
      const event = req.body;

      if (event.event === 'charge.success') {
        const { reference } = event.data;

        // Find and update transaction
        const transaction = await Transaction.findOne({ paymentReference: reference });

        if (transaction && !transaction.votesApplied) {
          transaction.paymentStatus = 'successful';
          transaction.votesApplied = true;
          transaction.metadata = event.data;
          await transaction.save();

          // Apply votes
          const candidate = await Candidate.findById(transaction.candidateId);
          candidate.votes += transaction.numberOfVotes;
          await candidate.save();
        }
      }

      res.status(200).send('Webhook received');
    } else {
      res.status(400).send('Invalid signature');
    }
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(500).send('Webhook error');
  }
};

// ═══════════════════════════════════════════
// WEBHOOK HANDLER FOR FLUTTERWAVE
// ═══════════════════════════════════════════
export const flutterwaveWebhook = async (req, res) => {
  try {
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    const signature = req.headers['verif-hash'];

    if (!signature || signature !== secretHash) {
      return res.status(401).send('Invalid signature');
    }

    const payload = req.body;

    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const { tx_ref } = payload.data;

      // Find and update transaction
      const transaction = await Transaction.findOne({ paymentReference: tx_ref });

      if (transaction && !transaction.votesApplied) {
        transaction.paymentStatus = 'successful';
        transaction.votesApplied = true;
        transaction.metadata = payload.data;
        await transaction.save();

        // Apply votes
        const candidate = await Candidate.findById(transaction.candidateId);
        candidate.votes += transaction.numberOfVotes;
        await candidate.save();
      }
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    res.status(500).send('Webhook error');
  }
};

// ═══════════════════════════════════════════
// GET ALL TRANSACTIONS
// ═══════════════════════════════════════════
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('candidateId', 'name category photo')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
    });
  }
};

// ═══════════════════════════════════════════
// GET TRANSACTION BY REFERENCE
// ═══════════════════════════════════════════
export const getTransactionByReference = async (req, res) => {
  try {
    const { reference } = req.params;

    const transaction = await Transaction.findOne({ paymentReference: reference }).populate(
      'candidateId'
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction',
    });
  }
};

// ═══════════════════════════════════════════
// GET VOTE PACKAGES
// ═══════════════════════════════════════════
export const getVotePackages = async (req, res) => {
  try {
    const packages = await VotePackage.find({ isActive: true }).sort({ numberOfVotes: 1 });

    // If no packages exist, return default packages
    if (packages.length === 0) {
      const pricePerVote = parseFloat(process.env.PRICE_PER_VOTE) || 100;
      const defaultPackages = [
        { name: '1 Vote', numberOfVotes: 1, price: pricePerVote, currency: 'NGN' },
        { name: '10 Votes', numberOfVotes: 10, price: pricePerVote * 10, currency: 'NGN' },
        { name: '50 Votes', numberOfVotes: 50, price: pricePerVote * 50, currency: 'NGN' },
      ];

      return res.status(200).json({
        success: true,
        packages: defaultPackages,
      });
    }

    res.status(200).json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vote packages',
    });
  }
};
