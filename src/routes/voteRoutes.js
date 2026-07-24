import express from 'express';
import {
  getVoteResults,
  getVoteStatistics,
} from '../controllers/voteController.js';

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

export default router;
