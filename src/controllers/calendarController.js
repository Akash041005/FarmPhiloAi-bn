const CropCalendar = require('../models/CropCalendar');
const logger = require('../utils/logger');

const getCalendar = async (req, res, next) => {
  try {
    const { region, state, season, crop } = req.query;
    const query = {};
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (region) query.region = { $regex: esc(region), $options: 'i' };
    if (state) query.state = { $regex: esc(state), $options: 'i' };
    if (season) query.season = season;
    if (crop) query.crop = { $regex: esc(crop), $options: 'i' };
    const calendar = await CropCalendar.find(query).sort({ crop: 1 });
    res.status(200).json({ success: true, calendar });
  } catch (error) { logger.error('Calendar fetch error:', error); next(error); }
};

const getRegions = async (req, res) => {
  try {
    const states = await CropCalendar.distinct('state');
    const regions = await CropCalendar.distinct('region');
    res.status(200).json({ success: true, states, regions });
  } catch (error) {
    res.status(200).json({ success: true, states: [], regions: [] });
  }
};

const getCurrentSeason = async (req, res, next) => {
  try {
    const month = new Date().getMonth() + 1;
    let season;
    if (month >= 6 && month <= 10) season = 'kharif';
    else if (month >= 11 || month <= 3) season = 'rabi';
    else season = 'zaid';
    let query = { season, isActive: true };
    if (req.query.state) query.state = { $regex: req.query.state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const activeCrops = await CropCalendar.find(query).sort({ crop: 1 });
    res.status(200).json({ success: true, season, month, activeCrops });
  } catch (error) { next(error); }
};

module.exports = { getCalendar, getRegions, getCurrentSeason };
