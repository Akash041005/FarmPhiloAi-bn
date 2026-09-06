const User = require('../models/User');
const History = require('../models/History');
const SoilReading = require('../models/SoilReading');
const logger = require('../utils/logger');

const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalScans, totalRecommendations, activeToday] = await Promise.all([
      User.countDocuments({ role: 'farmer' }),
      History.countDocuments(),
      SoilReading.countDocuments(),
      User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
    ]);
    const diseaseStats = await History.aggregate([
      { $group: { _id: '$result.disease', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    const cropStats = await History.aggregate([
      { $group: { _id: '$cropType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    const severityStats = await History.aggregate([
      { $group: { _id: '$result.severity', count: { $sum: 1 } } }
    ]);
    res.status(200).json({ success: true, stats: { totalUsers, totalScans, totalRecommendations, activeToday, diseaseStats, cropStats, severityStats } });
  } catch (error) { logger.error('Admin stats error:', error); next(error); }
};

const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const query = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } }
      ];
    }
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-password -__v');
    res.status(200).json({ success: true, users, pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total } });
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    await History.deleteMany({ userId: req.params.id });
    await SoilReading.deleteMany({ userId: req.params.id });
    logger.info(`Admin ${req.userId} deleted user ${req.params.id}`);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) { logger.error('Delete user error:', error); next(error); }
};

module.exports = { getStats, getUsers, deleteUser };
