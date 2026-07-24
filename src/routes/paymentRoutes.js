import express from 'express';
import {
  initializePayment,
  verifyPayment,
  initializeRegistrationPayment,
  verifyRegistrationPayment,
  paystackWebhook,
  flutterwaveWebhook,
  getAllTransactions,
  getTransactionByReference,
  getVotePackages,
} from '../controllers/paymentController.js';

const router = express.Router();

/**
 * @swagger
 * /api/payments/registration/initialize:
 *   post:
 *     summary: Initialize registration payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phone
 *               - paymentMethod
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [paystack, flutterwave, bank_transfer]
 *     responses:
 *       200:
 *         description: Registration payment initialized successfully
 */
router.post('/registration/initialize', initializeRegistrationPayment);

/**
 * @swagger
 * /api/payments/registration/verify:
 *   get:
 *     summary: Verify registration payment
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration payment verified successfully
 */
router.get('/registration/verify', verifyRegistrationPayment);

/**
 * @swagger
 * /api/payments/initialize:
 *   post:
 *     summary: Initialize a payment for voting
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phone
 *               - candidateId
 *               - numberOfVotes
 *               - paymentMethod
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               phone:
 *                 type: string
 *                 example: "08012345678"
 *               candidateId:
 *                 type: string
 *                 example: "60d5ec49f1b2c72b8c8e4f1b"
 *               numberOfVotes:
 *                 type: number
 *                 example: 10
 *               paymentMethod:
 *                 type: string
 *                 enum: [paystack, flutterwave, bank_transfer]
 *                 example: "paystack"
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Candidate not found
 */
router.post('/initialize', initializePayment);

/**
 * @swagger
 * /api/payments/verify:
 *   get:
 *     summary: Verify a payment transaction
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Payment verification failed
 *       404:
 *         description: Transaction not found
 */
router.get('/verify', verifyPayment);

/**
 * @swagger
 * /api/payments/packages:
 *   get:
 *     summary: Get available vote packages
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Vote packages retrieved successfully
 */
router.get('/packages', getVotePackages);

/**
 * @swagger
 * /api/payments/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get('/transactions', getAllTransactions);

/**
 * @swagger
 * /api/payments/transaction/{reference}:
 *   get:
 *     summary: Get transaction by reference
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details
 *       404:
 *         description: Transaction not found
 */
router.get('/transaction/:reference', getTransactionByReference);

// Webhook endpoints (no authentication needed)
router.post('/webhook/paystack', paystackWebhook);
router.post('/webhook/flutterwave', flutterwaveWebhook);

export default router;
