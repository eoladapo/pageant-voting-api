import Candidate from '../models/Candidate.js';
import Vote from '../models/vote.js';

/**
 * Get voting results with rankings
 */
export const getVoteResults = async (req, res) => {
  try {
    const results = await Candidate.aggregate([
      {
        $group: {
          _id: '$category',
          candidates: {
            $push: {
              name: '$name',
              votes: '$votes',
              photo: '$photo',
              bio: '$bio',
              age: '$age',
              candidateId: '$_id',
            },
          },
          totalVotes: { $sum: '$votes' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Sort candidates by votes in descending order and add ranking
    results.forEach((category) => {
      category.candidates.sort((a, b) => b.votes - a.votes);
      category.candidates = category.candidates.map((candidate, index) => ({
        ...candidate,
        rank: index + 1,
        isWinner: index === 0 && candidate.votes > 0,
      }));
    });

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch results',
      message: error.message,
    });
  }
};

/**
 * Get total vote statistics
 */
export const getVoteStatistics = async (req, res) => {
  try {
    const totalVotes = await Vote.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$numberOfVotes' },
        },
      },
    ]);

    const totalVotesCount = totalVotes[0]?.total || 0;
    const totalTransactions = await Vote.countDocuments();
    const totalCandidates = await Candidate.countDocuments();

    const categoryStats = await Candidate.aggregate([
      {
        $group: {
          _id: '$category',
          totalVotes: { $sum: '$votes' },
          candidates: { $sum: 1 },
        },
      },
    ]);

    // Get unique voters count
    const uniqueVoters = await Vote.distinct('voterEmail');

    res.json({
      success: true,
      statistics: {
        totalVotes: totalVotesCount,
        totalTransactions,
        totalVoters: uniqueVoters.length,
        totalCandidates,
        categoryStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
