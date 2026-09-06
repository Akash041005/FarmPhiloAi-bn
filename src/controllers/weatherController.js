const weatherService = require('../services/weatherService');
const WeatherData = require('../models/WeatherData');
const logger = require('../utils/logger');

const getWeather = async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (!lat || !lon) {
      return res.status(400).json({ success: false, error: 'Coordinates required', message: 'Please provide latitude and longitude' });
    }
    const weatherData = await weatherService.getWeatherData(lat, lon);
    if (req.userId) {
      try {
        await WeatherData.create({
          userId: req.userId,
          location: { latitude: lat, longitude: lon, name: weatherData.current.name || '' },
          current: weatherData.current,
          forecast: weatherData.forecast,
          agricultural_insights: weatherData.agricultural_insights
        });
      } catch (dbError) { /* non-critical */ }
    }
    res.status(200).json({ success: true, current: weatherData.current, forecast: weatherData.forecast, agricultural_insights: weatherData.agricultural_insights });
  } catch (error) { logger.error('Weather fetch error:', error); next(error); }
};

module.exports = { getWeather };
