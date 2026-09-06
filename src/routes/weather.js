const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const weatherController = require('../controllers/weatherController');

router.get('/', optionalAuth, weatherController.getWeather);

module.exports = router;
