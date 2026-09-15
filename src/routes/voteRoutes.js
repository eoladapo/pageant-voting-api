import express from 'express';
import {
  getVoteResults,
  getVoteStatistics,
  resetVotes,
} from '../controllers/voteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ═══════════════════════════════════════════
// PUBLIC ROUTES - No authentication needed
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/votes/results:
 *   get:
 *     summary: Get voting results
 *     tags: [Votes]
 *     responses:
 *       200:
 *         description: Voting results for all categories
 */
router.get('/results', getVoteResults);

/**
 * @swagger
 * /api/votes/statistics:
 *   get:
 *     summary: Get voting statistics
 *     tags: [Votes]
 *     responses:
 *       200:
 *         description: Overall voting statistics
 */
router.get('/statistics', getVoteStatistics);

// ═══════════════════════════════════════════
// ADMIN ROUTES - Authentication required
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/votes/reset:
 *   delete:
 *     summary: Reset all votes for all candidates
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All votes reset successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/reset', protect, resetVotes);

/**
 * @swagger
 * /api/votes/reset/{candidateId}:
 *   delete:
 *     summary: Reset votes for a specific candidate
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *         description: The candidate ID
 *     responses:
 *       200:
 *         description: Votes reset successfully for candidate
 *       404:
 *         description: Candidate not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/reset/:candidateId', protect, resetVotes);

export default router;
