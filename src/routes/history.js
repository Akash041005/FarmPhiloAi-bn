const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const History = require('../models/History');
const logger = require('../utils/logger');

router.get('/', auth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const cropType = req.query.cropType;
    const disease = req.query.disease;
    const bookmarked = req.query.bookmarked;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query = { userId: req.userId };

    if (cropType) query.cropType = cropType;
    if (disease) query['result.disease'] = disease;
    if (bookmarked === 'true') query.isBookmarked = true;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await History.countDocuments(query);
    const history = await History.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v');

    res.status(200).json({
      success: true,
      history,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    logger.error('Get history error:', error);
    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const history = await History.findOne({
      _id: req.params.id,
      userId: req.userId
    }).select('-__v');

    if (!history) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Scan history not found'
      });
    }

    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    logger.error('Get history by id error:', error);
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const history = await History.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!history) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Scan history not found'
      });
    }

    logger.info(`Deleted history: ${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Scan deleted successfully'
    });
  } catch (error) {
    logger.error('Delete history error:', error);
    next(error);
  }
});

router.patch('/:id/bookmark', auth, async (req, res, next) => {
  try {
    const { isBookmarked } = req.body;

    const history = await History.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { isBookmarked: isBookmarked } },
      { new: true }
    ).select('-__v');

    if (!history) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Scan history not found'
      });
    }

    res.status(200).json({
      success: true,
      message: isBookmarked ? 'Bookmark added' : 'Bookmark removed',
      history
    });
  } catch (error) {
    logger.error('Bookmark error:', error);
    next(error);
  }
});

router.patch('/:id/tags', auth, async (req, res, next) => {
  try {
    const { tags } = req.body;

    const history = await History.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { tags: tags } },
      { new: true }
    ).select('-__v');

    if (!history) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Scan history not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tags updated',
      history
    });
  } catch (error) {
    logger.error('Update tags error:', error);
    next(error);
  }
});

router.get('/stats/summary', auth, async (req, res, next) => {
  try {
    const totalScans = await History.countDocuments({ userId: req.userId });
    
    const diseaseStats = await History.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: '$result.disease', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const cropStats = await History.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: '$cropType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const severityStats = await History.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: '$result.severity', count: { $sum: 1 } } }
    ]);

    const recentActivity = await History.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('cropType result.disease result.severity createdAt');

    res.status(200).json({
      success: true,
      stats: {
        totalScans,
        diseaseStats,
        cropStats,
        severityStats,
        recentActivity
      }
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    next(error);
  }
});

module.exports = router;