import express from 'express';
import {
  getRegistrationSettings,
  registerUser,
  getUserById,
} from '../controllers/userController.js';

const router = express.Router();

/**
 * @swagger
 * /api/users/registration/settings:
 *   get:
 *     summary: Get registration settings
 *     tags: [User Registration]
 *     description: Check if payment is required before registration and get registration fee
 *     responses:
 *       200:
 *         description: Registration settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     requirePaymentBeforeRegistration:
 *                       type: boolean
 *                     registrationFee:
 *                       type: number
 *                     registrationEnabled:
 *                       type: boolean
 */
router.get('/registration/settings', getRegistrationSettings);

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User Registration]
 *     description: Register user to become a contestant. Payment reference required if payment is enabled.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Doe"
 *               email:
 *                 type: string
 *                 example: "jane@example.com"
 *               phone:
 *                 type: string
 *                 example: "08012345678"
 *               age:
 *                 type: number
 *                 example: 22
 *               category:
 *                 type: string
 *                 enum: [Miss, Mister, Teen]
 *                 example: "Miss"
 *               bio:
 *                 type: string
 *               socialMedia:
 *                 type: object
 *                 properties:
 *                   instagram:
 *                     type: string
 *                   facebook:
 *                     type: string
 *                   twitter:
 *                     type: string
 *                   tiktok:
 *                     type: string
 *               transactionReference:
 *                 type: string
 *                 description: Required if payment is enabled
 *                 example: "REG-1234567890-ABCD"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or payment required
 */
router.post('/register', registerUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [User Registration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', getUserById);

export default router;
