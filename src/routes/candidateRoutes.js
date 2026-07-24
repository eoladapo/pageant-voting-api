import express from 'express';
import {
  getAllCandidates,
  getCandidatesByCategory,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from '../controllers/candidateController.js';

const router = express.Router();

// ═══════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: Get all candidates
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: List of all candidates
 */
router.get('/', getAllCandidates);

/**
 * @swagger
 * /api/candidates/category/{category}:
 *   get:
 *     summary: Get candidates by category
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Miss, Mister, Teen]
 */
router.get('/category/:category', getCandidatesByCategory);

/**
 * @swagger
 * /api/candidates/{id}:
 *   get:
 *     summary: Get candidate by ID
 *     tags: [Candidates]
 */
router.get('/:id', getCandidateById);

// ═══════════════════════════════════════════
// ADMIN ROUTES (No auth for now - can add API key later)
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/candidates:
 *   post:
 *     summary: Create a new candidate
 *     tags: [Candidates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - age
 *               - photo
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               age:
 *                 type: number
 *               photo:
 *                 type: string
 *               bio:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Miss, Mister, Teen]
 */
router.post('/', createCandidate);

/**
 * @swagger
 * /api/candidates/{id}:
 *   put:
 *     summary: Update candidate
 *     tags: [Candidates]
 */
router.put('/:id', updateCandidate);

/**
 * @swagger
 * /api/candidates/{id}:
 *   delete:
 *     summary: Delete candidate
 *     tags: [Candidates]
 */
router.delete('/:id', deleteCandidate);

export default router;
