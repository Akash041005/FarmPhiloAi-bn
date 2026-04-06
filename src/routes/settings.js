const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

router.put('/location', auth, async (req, res, next) => {
  try {
    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Coordinates required',
        message: 'Please provide latitude and longitude'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          'location.latitude': latitude,
          'location.longitude': longitude,
          'location.address': address || null,
          'location.lastUpdated': new Date()
        }
      },
      { new: true }
    );

    logger.info(`Location updated for user: ${req.userId}`);

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      location: user.location
    });
  } catch (error) {
    logger.error('Update location error:', error);
    next(error);
  }
});

router.put('/profile', auth, async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
});

router.put('/preferences', auth, async (req, res, next) => {
  try {
    const { language, theme } = req.body;
    const updates = {};

    if (language && ['en', 'hi'].includes(language)) {
      updates.language = language;
    }
    if (theme && ['light', 'dark', 'auto'].includes(theme)) {
      updates.theme = theme;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      language: user.language,
      theme: user.theme
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    next(error);
  }
});

router.get('/', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    res.status(200).json({
      success: true,
      settings: {
        profile: {
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        location: user.location,
        language: user.language,
        theme: user.theme,
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    next(error);
  }
});

module.exports = router;