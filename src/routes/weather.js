const express = require('express');
const router = express.Router();

const { auth, optionalAuth } = require('../middleware/auth');
const weatherService = require('../services/weatherService');
const logger = require('../utils/logger');

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Coordinates required',
        message: 'Please provide latitude and longitude'
      });
    }

    const weatherData = await weatherService.getWeatherData(lat, lon);

    res.status(200).json({
      success: true,
      current: weatherData.current,
      forecast: weatherData.forecast,
      agricultural_insights: weatherData.agricultural_insights
    });
  } catch (error) {
    logger.error('Weather fetch error:', error);
    next(error);
  }
});

module.exports = router;