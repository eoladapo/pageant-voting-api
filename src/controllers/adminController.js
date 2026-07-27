import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Candidate from '../models/Candidate.js';
import AppSettings from '../models/AppSettings.js';
import Vote from '../models/vote.js';
import Transaction from '../models/Transaction.js';
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
    const { status, paymentStatus, category, search } = req.query;

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

    const users = await User.find(query).sort({ registeredAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
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
