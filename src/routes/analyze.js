const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const { upload, processImage, generateImageHash } = require('../services/imageService');
const geminiService = require('../services/geminiService');
const weatherService = require('../services/weatherService');
const { getCachedAnalysis, cacheAnalysis, getCacheStats } = require('../services/cacheService');
const History = require('../models/History');
const logger = require('../utils/logger');

router.post('/', auth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image required',
        message: 'Please upload a crop image'
      });
    }

    const { cropType, voiceInput, latitude, longitude } = req.body;
    const lat = parseFloat(latitude) || null;
    const lon = parseFloat(longitude) || null;

    logger.info(`Analyzing crop image: ${cropType || 'Unknown crop'}`);

    const imageBuffer = await processImage(req.file.path);
    
    let weatherData = null;
    if (lat && lon) {
      try {
        weatherData = await weatherService.getWeatherData(lat, lon);
      } catch (weatherError) {
        logger.warn('Weather fetch failed, continuing without weather data');
      }
    }

    const location = lat && lon ? `${lat}, ${lon}` : req.user.location?.address || 'Unknown';

    const result = await geminiService.analyzeCropImage(
      imageBuffer,
      cropType,
      weatherData,
      location
    );

    const imageUrl = `/uploads/crops/${req.file.filename}`;
    
    const historyEntry = await History.create({
      userId: req.userId,
      image: {
        url: imageUrl,
        publicId: req.file.filename,
        thumbnailUrl: imageUrl
      },
      cropType: cropType || 'Unknown',
      result,
      weather: weatherData ? {
        temperature: weatherData.current.temp,
        humidity: weatherData.current.humidity,
        description: weatherData.current.description,
        windSpeed: weatherData.current.wind_speed,
        rainChance: weatherData.forecast.daily[0]?.pop || 0
      } : null,
      location: {
        latitude: lat,
        longitude: lon,
        address: req.user.location?.address || ''
      },
      voiceInput: voiceInput || null
    });

    logger.info(`Analysis complete: ${result.disease} (confidence: ${result.confidence}%)`);

    res.status(200).json({
      success: true,
      scanId: historyEntry._id,
      result: {
        ...result,
        cropType: cropType || 'Unknown'
      },
      weather: weatherData ? {
        current: weatherData.current,
        forecast: weatherData.forecast,
        agricultural_insights: weatherData.agricultural_insights
      } : null,
      timestamp: historyEntry.createdAt
    });
  } catch (error) {
    logger.error('Analysis error:', error);

    if (req.file) {
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        logger.warn('Failed to clean up uploaded file');
      }
    }

    const isRateLimited =
      error.message?.includes('429') ||
      error.message?.includes('quota') ||
      error.message?.includes('rate limit') ||
      error.message?.includes('too many requests');

    if (isRateLimited) {
      return res.status(429).json({
        success: false,
        error: 'API rate limit reached',
        message: 'Our AI service is temporarily busy due to high demand. Please try again in a few minutes.',
        retryAfter: 60,
        suggestion: 'Try uploading a smaller or lower quality image, or wait a minute before retrying.'
      });
    }

    if (error.message.includes('Failed to analyze')) {
      return res.status(500).json({
        success: false,
        error: 'Analysis failed',
        message: 'Could not analyze the image. Please try again with a clearer image.'
      });
    }

    next(error);
  }
});

router.get('/cache/stats', auth, (req, res) => {
  const stats = getCacheStats();
  res.json({
    success: true,
    cache: stats,
    message: stats.hitRate > 0
      ? `Cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`
      : 'No cache data yet'
  });
});

router.post('/voice', auth, async (req, res, next) => {
  try {
    const { transcript, cropType, latitude, longitude } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Transcript required',
        message: 'Please provide a voice transcript'
      });
    }

    logger.info(`Processing voice input: ${transcript}`);

    let weatherData = null;
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (lat && lon) {
      try {
        weatherData = await weatherService.getWeatherData(lat, lon);
      } catch (weatherError) {
        logger.warn('Weather fetch failed');
      }
    }

    const location = lat && lon ? `${lat}, ${lon}` : 'Unknown';
    
    const result = await geminiService.generateVoiceResponse(
      transcript,
      weatherData,
      location
    );

    res.status(200).json({
      success: true,
      result: {
        ...result,
        cropType: cropType || 'Unknown'
      },
      weather: weatherData ? {
        current: weatherData.current,
        forecast: weatherData.forecast,
        agricultural_insights: weatherData.agricultural_insights
      } : null,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Voice analysis error:', error);
    next(error);
  }
});

module.exports = router;