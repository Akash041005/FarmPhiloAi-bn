const { spawn } = require('child_process');
const path = require('path');
const SoilReading = require('../models/SoilReading');
const Recommendation = require('../models/Recommendation');
const logger = require('../utils/logger');

const recommendCrop = async (req, res, next) => {
  try {
    const { nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall } = req.body;

    if (!nitrogen || !phosphorus || !potassium || !temperature || !humidity || !ph || !rainfall) {
      return res.status(400).json({ success: false, error: 'All soil parameters are required', message: 'Please provide N, P, K, temperature, humidity, pH, and rainfall' });
    }

    const mlScriptPath = path.join(__dirname, '../../ml_service/predict.py');
    const pythonPath = process.platform === 'win32' ? 'python' : 'python3';

    const result = await new Promise((resolve, reject) => {
      const python = spawn(pythonPath, [mlScriptPath, JSON.stringify({
        N: parseFloat(nitrogen), P: parseFloat(phosphorus), K: parseFloat(potassium),
        temperature: parseFloat(temperature), humidity: parseFloat(humidity),
        ph: parseFloat(ph), rainfall: parseFloat(rainfall)
      })]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => { stdout += data.toString(); });
      python.stderr.on('data', (data) => { stderr += data.toString(); });

      python.on('close', (code) => {
        if (code !== 0) {
          logger.error(`ML script error: ${stderr}`);
          reject(new Error(stderr || 'ML prediction failed'));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(new Error('Invalid ML response'));
        }
      });

      python.on('error', (err) => {
        logger.error(`Failed to start ML script: ${err.message}`);
        reject(new Error('ML service unavailable'));
      });
    });

    const soilReading = await SoilReading.create({
      userId: req.userId,
      nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall,
      result: {
        recommendations: result.recommendations,
        topCrop: result.recommendations[0]?.crop || '',
        allConfidences: result.recommendations.reduce((acc, r) => {
          acc[r.crop] = r.confidence;
          return acc;
        }, {})
      }
    });

    await Recommendation.create({
      userId: req.userId,
      type: 'crop',
      soilReadingId: soilReading._id,
      input: { soilParams: { N: nitrogen, P: phosphorus, K: potassium, temperature, humidity, pH: ph, rainfall } },
      result: { cropRecommendations: result.recommendations },
      aiModelUsed: 'random-forest',
      confidence: result.recommendations[0]?.confidence || 0
    });

    res.status(200).json({
      success: true,
      recommendations: result.recommendations,
      topCrop: result.recommendations[0]?.crop || '',
      soilReadingId: soilReading._id
    });
  } catch (error) {
    logger.error('Crop recommendation error:', error);
    next(error);
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const total = await SoilReading.countDocuments({ userId: req.userId });
    const readings = await SoilReading.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.status(200).json({
      success: true, soilReadings: readings,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total }
    });
  } catch (error) { next(error); }
};

const getRecommendationById = async (req, res, next) => {
  try {
    const reading = await SoilReading.findOne({ _id: req.params.id, userId: req.userId });
    if (!reading) return res.status(404).json({ success: false, error: 'Not found' });
    res.status(200).json({ success: true, soilReading: reading });
  } catch (error) { next(error); }
};

const deleteRecommendation = async (req, res, next) => {
  try {
    const reading = await SoilReading.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!reading) return res.status(404).json({ success: false, error: 'Not found' });
    res.status(200).json({ success: true, message: 'Recommendation deleted' });
  } catch (error) { next(error); }
};

module.exports = { recommendCrop, getRecommendations, getRecommendationById, deleteRecommendation };
