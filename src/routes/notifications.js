const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');

router.get('/', auth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const query = { userId: req.userId };
    if (unreadOnly) query.read = false;

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      read: false
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    next(error);
  }
});

router.put('/:id/read', auth, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    logger.error('Mark read error:', error);
    next(error);
  }
});

router.put('/read-all', auth, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger.error('Mark all read error:', error);
    next(error);
  }
});

router.post('/subscribe', auth, async (req, res, next) => {
  try {
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        error: 'Push token required',
        message: 'Please provide a push token'
      });
    }

    await User.findByIdAndUpdate(req.userId, {
      $set: { pushToken }
    });

    logger.info(`Push token updated for user: ${req.userId}`);

    res.status(200).json({
      success: true,
      message: 'Subscribed to notifications'
    });
  } catch (error) {
    logger.error('Subscribe error:', error);
    next(error);
  }
});

router.put('/settings', auth, async (req, res, next) => {
  try {
    const {
      enabled,
      frequency,
      quietHours,
      types
    } = req.body;

    const updates = {};
    
    if (typeof enabled === 'boolean') {
      updates['notificationPreferences.enabled'] = enabled;
    }
    if (['6h', '12h', 'daily'].includes(frequency)) {
      updates['notificationPreferences.frequency'] = frequency;
    }
    if (quietHours) {
      if (quietHours.start) updates['notificationPreferences.quietHours.start'] = quietHours.start;
      if (quietHours.end) updates['notificationPreferences.quietHours.end'] = quietHours.end;
    }
    if (types) {
      if (typeof types.diseaseAlerts === 'boolean') {
        updates['notificationPreferences.types.diseaseAlerts'] = types.diseaseAlerts;
      }
      if (typeof types.weatherAlerts === 'boolean') {
        updates['notificationPreferences.types.weatherAlerts'] = types.weatherAlerts;
      }
      if (typeof types.tips === 'boolean') {
        updates['notificationPreferences.types.tips'] = types.tips;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Notification settings updated',
      notificationPreferences: user.notificationPreferences
    });
  } catch (error) {
    logger.error('Update notification settings error:', error);
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    next(error);
  }
});

module.exports = router;