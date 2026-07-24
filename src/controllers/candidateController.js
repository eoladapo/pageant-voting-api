import Candidate from '../models/Candidate.js';

/**
 * Get all candidates (only active)
 */
export const getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find({ isActive: true })
      .populate('userId', 'name email phone')
      .sort({ category: 1, votes: -1 });

    res.json({
      success: true,
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidates',
      message: error.message,
    });
  }
};

/**
 * Get candidates by category (only active)
 */
export const getCandidatesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const candidates = await Candidate.find({ category, isActive: true })
      .populate('userId', 'name email phone')
      .sort({ votes: -1 });

    res.json({
      success: true,
      count: candidates.length,
      category,
      candidates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidates',
      message: error.message,
    });
  }
};

/**
 * Get single candidate by ID
 */
export const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findById(id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found',
      });
    }

    res.json({
      success: true,
      candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Create a new candidate (Admin only)
 */
export const createCandidate = async (req, res) => {
  try {
    const candidate = new Candidate(req.body);
    await candidate.save();

    res.status(201).json({
      success: true,
      candidate,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create candidate',
      message: error.message,
    });
  }
};

/**
 * Update candidate (Admin only)
 */
export const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found',
      });
    }

    res.json({
      success: true,
      candidate,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update candidate',
      message: error.message,
    });
  }
};

/**
 * Delete candidate (Admin only)
 */
export const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findByIdAndDelete(id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found',
      });
    }

    res.json({
      success: true,
      message: 'Candidate deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
