import express from 'express';
import {
  adminLogin,
  getSettings,
  updateSettings,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  approveContestant,
  rejectContestant,
  bulkUploadUsers,
  addVotesToContestant,
  getDashboardStats,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadImage, uploadCSV } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ═══════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@pageant.com"
 *               password:
 *                 type: string
 *                 example: "admin123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     admin:
 *                       $ref: '#/components/schemas/Admin'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', adminLogin);

// ═══════════════════════════════════════════
// PROTECTED ROUTES (Require authentication)
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get app settings
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AppSettings'
 */
router.get('/settings', protect, getSettings);

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update app settings
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppSettings'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.put('/settings', protect, updateSettings);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', protect, getDashboardStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with filters
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [paid, not_required, pending]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Miss, Mister, Teen]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users', protect, getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details with candidate info if approved
 *       404:
 *         description: User not found
 */
router.get('/users/:id', protect, getUserById);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user details
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               age:
 *                 type: number
 *               category:
 *                 type: string
 *               bio:
 *                 type: string
 *               photo:
 *                 type: string
 *                 format: binary
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/users/:id', protect, uploadImage, updateUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/users/:id', protect, deleteUser);

/**
 * @swagger
 * /api/admin/users/{id}/approve:
 *   post:
 *     summary: Approve user as contestant
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User approved successfully
 */
router.post('/users/:id/approve', protect, approveContestant);

/**
 * @swagger
 * /api/admin/users/{id}/reject:
 *   post:
 *     summary: Reject user contestant application
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: User application rejected
 */
router.post('/users/:id/reject', protect, rejectContestant);

/**
 * @swagger
 * /api/admin/users/bulk-upload:
 *   post:
 *     summary: Bulk upload users from CSV/Excel
 *     tags: [Admin Bulk Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or Excel file
 *               autoApprove:
 *                 type: boolean
 *                 description: Auto-approve users as contestants
 *     responses:
 *       200:
 *         description: Bulk upload completed with results
 */
router.post('/users/bulk-upload', protect, uploadCSV, bulkUploadUsers);

/**
 * @swagger
 * /api/admin/votes/add:
 *   post:
 *     summary: Manually add votes to contestant
 *     tags: [Admin Vote Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - candidateId
 *               - votes
 *             properties:
 *               candidateId:
 *                 type: string
 *               votes:
 *                 type: number
 *                 minimum: 1
 *               reason:
 *                 type: string
 *                 example: "Offline votes from event"
 *     responses:
 *       200:
 *         description: Votes added successfully
 */
router.post('/votes/add', protect, addVotesToContestant);

export default router;
