import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Candidate from '../models/Candidate.js';
import AppSettings from '../models/AppSettings.js';
import Vote from '../models/vote.js';
import Transaction from '../models/Transaction.js';
import ContactMessage from '../models/ContactMessage.js';
import QuoteRequest from '../models/QuoteRequest.js';
import jwt from 'jsonwebtoken';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';
import { bulkImportUsers } from '../services/bulkImportService.js';

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════

/**
 * @desc    Admin login
 * @route   POST /api/admin/login
 * @access  Public
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const isPasswordCorrect = await admin.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
};

// ═══════════════════════════════════════════
// SETTINGS MANAGEMENT
// ═══════════════════════════════════════════

/**
 * @desc    Get app settings
 * @route   GET /api/admin/settings
 * @access  Private (Admin)
 */
export const getSettings = async (req, res) => {
  try {
    const settings = await AppSettings.getSettings();
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
    });
  }
};

/**
 * @desc    Update app settings
 * @route   PUT /api/admin/settings
 * @access  Private (Admin)
 */
export const updateSettings = async (req, res) => {
  try {
    const settings = await AppSettings.getSettings();

    const allowedFields = [
      'requirePaymentBeforeRegistration',
      'registrationFee',
      'votingEnabled',
      'registrationEnabled',
      'pricePerVote',
      'minimumVoteUnit',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
    });
  }
};

// ═══════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════

/**
 * @desc    Get all users with filters
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { status, paymentStatus, category, search, page = 1, limit = 10 } = req.query;

    let query = {};

    if (status) {
      query.contestantStatus = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination metadata
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limitNum);

    // Fetch paginated users
    const users = await User.find(query)
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: totalUsers,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin)
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get associated candidate if approved
    let candidate = null;
    if (user.contestantStatus === 'approved') {
      candidate = await Candidate.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        candidate,
      },
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
 * @desc    Update user details
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin)
 */
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Handle photo upload
    if (req.file) {
      try {
        // Delete old photo if exists
        if (user.photo && user.photo !== 'https://via.placeholder.com/400') {
          await deleteFromCloudinary(user.photo).catch((err) =>
            console.log('Error deleting old photo:', err),
          );
        }

        // Upload new photo
        const photoUrl = await uploadToCloudinary(req.file.buffer, 'pageant-voting/users');
        req.body.photo = photoUrl;
      } catch (error) {
        console.error('Photo upload error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload photo',
        });
      }
    }

    // Update allowed fields
    const allowedFields = [
      'name',
      'email',
      'phone',
      'age',
      'photo',
      'bio',
      'category',
      'socialMedia',
      'adminNotes',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    // Update candidate if user is approved
    if (user.contestantStatus === 'approved') {
      const candidate = await Candidate.findOne({ userId: user._id });
      if (candidate) {
        candidate.name = user.name;
        candidate.age = user.age || candidate.age;
        candidate.photo = user.photo || candidate.photo;
        candidate.bio = user.bio || candidate.bio;
        candidate.category = user.category || candidate.category;
        candidate.socialMedia = user.socialMedia || candidate.socialMedia;
        await candidate.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message,
    });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Delete associated candidate
    await Candidate.findOneAndDelete({ userId: user._id });

    // Delete user photo from Cloudinary
    if (user.photo && user.photo !== 'https://via.placeholder.com/400') {
      await deleteFromCloudinary(user.photo).catch((err) =>
        console.log('Error deleting photo:', err),
      );
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
};

// ═══════════════════════════════════════════
// CONTESTANT APPROVAL
// ═══════════════════════════════════════════

/**
 * @desc    Approve user as contestant
 * @route   POST /api/admin/users/:id/approve
 * @access  Private (Admin)
 */
export const approveContestant = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (user.contestantStatus === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'User is already approved as contestant',
      });
    }

    // Update user status
    user.contestantStatus = 'approved';
    user.approvedAt = new Date();
    await user.save();

    // Create candidate entry
    const candidate = await Candidate.create({
      userId: user._id,
      name: user.name,
      age: user.age || 18,
      photo: user.photo || 'https://via.placeholder.com/400',
      bio: user.bio || '',
      category: user.category || 'Miss',
      socialMedia: user.socialMedia,
      votes: 0,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      message: 'User approved as contestant successfully',
      data: {
        user,
        candidate,
      },
    });
  } catch (error) {
    console.error('Error approving contestant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve contestant',
      message: error.message,
    });
  }
};

/**
 * @desc    Reject user contestant application
 * @route   POST /api/admin/users/:id/reject
 * @access  Private (Admin)
 */
export const rejectContestant = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    user.contestantStatus = 'rejected';
    user.rejectedAt = new Date();
    if (req.body.adminNotes) {
      user.adminNotes = req.body.adminNotes;
    }
    await user.save();

    // Remove candidate if exists
    await Candidate.findOneAndDelete({ userId: user._id });

    res.status(200).json({
      success: true,
      message: 'User application rejected',
      data: user,
    });
  } catch (error) {
    console.error('Error rejecting contestant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject contestant',
    });
  }
};

// ═══════════════════════════════════════════
// BULK OPERATIONS
// ═══════════════════════════════════════════

/**
 * @desc    Bulk upload users from CSV/Excel
 * @route   POST /api/admin/users/bulk-upload
 * @access  Private (Admin)
 */
export const bulkUploadUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a CSV or Excel file',
      });
    }

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const fileType = fileExtension === 'csv' ? 'csv' : 'excel';
    const autoApprove = req.body.autoApprove === 'true' || req.body.autoApprove === true;

    const result = await bulkImportUsers(req.file.buffer, fileType, autoApprove);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bulk upload completed',
      data: result.results,
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Bulk upload failed',
      message: error.message,
    });
  }
};

// ═══════════════════════════════════════════
// VOTE MANAGEMENT
// ═══════════════════════════════════════════

/**
 * @desc    Manually add votes to a contestant
 * @route   POST /api/admin/votes/add
 * @access  Private (Admin)
 */
export const addVotesToContestant = async (req, res) => {
  try {
    const { candidateId, votes, reason } = req.body;

    if (!candidateId || !votes) {
      return res.status(400).json({
        success: false,
        error: 'Please provide candidateId and number of votes',
      });
    }

    if (votes < 1) {
      return res.status(400).json({
        success: false,
        error: 'Number of votes must be at least 1',
      });
    }

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found',
      });
    }

    // Add votes
    candidate.votes += parseInt(votes);
    await candidate.save();

    // Create admin transaction record
    const transaction = await Transaction.create({
      fullName: 'Admin Override',
      email: req.admin.email,
      phone: 'N/A',
      purpose: 'vote_purchase',
      candidateId: candidate._id,
      numberOfVotes: votes,
      amount: 0,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'successful',
      paymentReference: `ADMIN-${Date.now()}`,
      votesApplied: true,
      metadata: {
        adminId: req.admin._id,
        reason: reason || 'Manual admin addition',
        type: 'admin_override',
      },
    });

    // Create vote record linked to the transaction
    await Vote.create({
      transactionId: transaction._id,
      candidateId: candidate._id,
      category: candidate.category,
      numberOfVotes: votes,
      voterEmail: req.admin.email,
      voterName: 'Admin Override',
    });

    res.status(200).json({
      success: true,
      message: `Successfully added ${votes} votes to ${candidate.name}`,
      data: {
        candidateId: candidate._id,
        candidateName: candidate.name,
        votesAdded: votes,
        newTotalVotes: candidate.votes,
        reason: reason || 'Manual admin addition',
      },
    });
  } catch (error) {
    console.error('Error adding votes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add votes',
      message: error.message,
    });
  }
};

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingUsers = await User.countDocuments({ contestantStatus: 'pending' });
    const approvedContestants = await User.countDocuments({ contestantStatus: 'approved' });
    const rejectedUsers = await User.countDocuments({ contestantStatus: 'rejected' });

    const totalVotes = await Vote.aggregate([
      { $group: { _id: null, total: { $sum: '$numberOfVotes' } } },
    ]);

    const totalRevenue = await Transaction.aggregate([
      { $match: { paymentStatus: 'successful' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const topCandidates = await Candidate.find()
      .sort({ votes: -1 })
      .limit(5)
      .select('name category votes photo');

    // Get category-specific statistics
    const categoryStats = await Candidate.aggregate([
      {
        $group: {
          _id: '$category',
          totalVotes: { $sum: '$votes' },
          candidates: { $sum: 1 },
        },
      },
    ]);

    // Enhance category stats with transactions and voters data
    const enhancedCategoryStats = await Promise.all(
      categoryStats.map(async (category) => {
        // Get all candidate IDs in this category
        const candidatesInCategory = await Candidate.find({ category: category._id }).select('_id');
        const candidateIds = candidatesInCategory.map((c) => c._id);

        // Count transactions for this category's candidates
        const totalTransactions = await Transaction.countDocuments({
          candidateId: { $in: candidateIds },
          paymentStatus: 'successful',
          purpose: 'vote_purchase',
        });

        // Count unique voters for this category
        const uniqueVoters = await Vote.distinct('voterEmail', {
          category: category._id,
        });

        return {
          _id: category._id,
          totalVotes: category.totalVotes,
          candidates: category.candidates,
          totalTransactions: totalTransactions,
          totalVoters: uniqueVoters.length,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          pending: pendingUsers,
          approved: approvedContestants,
          rejected: rejectedUsers,
        },
        votes: {
          total: totalVotes[0]?.total || 0,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
        },
        topCandidates,
        categoryStats: enhancedCategoryStats,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
};

// ═══════════════════════════════════════════
// CONTACT MESSAGE MANAGEMENT
// ═══════════════════════════════════════════

/**
 * @desc    Get all contact messages with filters
 * @route   GET /api/admin/messages
 * @access  Private (Admin)
 */
export const getAllMessages = async (req, res) => {
  try {
    const { status, subject, search, page = 1, limit = 10 } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (subject) {
      query.subject = subject;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination metadata
    const totalMessages = await ContactMessage.countDocuments(query);
    const totalPages = Math.ceil(totalMessages / limitNum);

    // Fetch paginated messages
    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: totalMessages,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
    });
  }
};

/**
 * @desc    Get single message by ID
 * @route   GET /api/admin/messages/:id
 * @access  Private (Admin)
 */
export const getMessageById = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    // Mark as read if it's new
    if (message.status === 'new') {
      message.status = 'read';
      message.readAt = new Date();
      await message.save();
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch message',
    });
  }
};

/**
 * @desc    Update message status or add admin notes
 * @route   PUT /api/admin/messages/:id
 * @access  Private (Admin)
 */
export const updateMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    const { status, adminNotes } = req.body;

    if (status) {
      message.status = status;
      if (status === 'replied' && !message.repliedAt) {
        message.repliedAt = new Date();
      }
    }

    if (adminNotes !== undefined) {
      message.adminNotes = adminNotes;
    }

    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: message,
    });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update message',
    });
  }
};

/**
 * @desc    Delete message
 * @route   DELETE /api/admin/messages/:id
 * @access  Private (Admin)
 */
export const deleteMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message',
    });
  }
};

// ═══════════════════════════════════════════
// QUOTE REQUEST MANAGEMENT
// ═══════════════════════════════════════════

/**
 * @desc    Get all quote requests
 * @route   GET /api/admin/quotes
 * @access  Private (Admin)
 */
export const getAllQuotes = async (req, res) => {
  try {
    const { status, service, page = 1, limit = 10 } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (service) {
      query.service = service;
    }

    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination metadata
    const totalQuotes = await QuoteRequest.countDocuments(query);
    const totalPages = Math.ceil(totalQuotes / limitNum);

    // Fetch paginated quotes
    const quotes = await QuoteRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: quotes.length,
      data: quotes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: totalQuotes,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quotes',
    });
  }
};

/**
 * @desc    Get single quote by ID
 * @route   GET /api/admin/quotes/:id
 * @access  Private (Admin)
 */
export const getQuoteById = async (req, res) => {
  try {
    const quote = await QuoteRequest.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found',
      });
    }

    if (quote.status === 'new') {
      quote.status = 'read';
      await quote.save();
    }

    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quote',
    });
  }
};

/**
 * @desc    Update quote status
 * @route   PUT /api/admin/quotes/:id
 * @access  Private (Admin)
 */
export const updateQuote = async (req, res) => {
  try {
    const quote = await QuoteRequest.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found',
      });
    }

    const { status, adminNotes } = req.body;

    if (status) {
      quote.status = status;
    }

    if (adminNotes !== undefined) {
      quote.adminNotes = adminNotes;
    }

    await quote.save();

    res.status(200).json({
      success: true,
      message: 'Quote updated successfully',
      data: quote,
    });
  } catch (error) {
    console.error('Error updating quote:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update quote',
    });
  }
};

/**
 * @desc    Delete quote
 * @route   DELETE /api/admin/quotes/:id
 * @access  Private (Admin)
 */
export const deleteQuote = async (req, res) => {
  try {
    const quote = await QuoteRequest.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found',
      });
    }

    await quote.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Quote deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete quote',
    });
  }
};
