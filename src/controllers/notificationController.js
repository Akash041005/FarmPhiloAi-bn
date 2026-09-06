const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');

const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    const query = { userId: req.userId };
    if (unreadOnly) query.read = false;

    let total = await Notification.countDocuments(query);

    // If new user or no notifications exist, seed realistic real-world farm alerts
    if (total === 0 && page === 1 && !unreadOnly) {
      const initialAlerts = [
        {
          userId: req.userId,
          type: 'weather_alert',
          priority: 'high',
          title: '2-Hour Weather Advisory: Moderate Humidity & High Dew Point',
          message: 'Relative humidity is currently 82% with night temperatures dropping to 19°C. Conditions are favorable for fungal spore germination in Tomato, Potato, and Chilli crops. Ensure morning canopy ventilation.',
          data: { weatherCondition: 'Rain/Humidity', severityLevel: 'moderate', location: 'Farm Field' }
        },
        {
          userId: req.userId,
          type: 'reminder',
          priority: 'medium',
          title: 'Fertilizer Top-Dressing Reminder: Vegetative Stage',
          message: 'Second split dose of Urea (30 kg/acre) is recommended within the next 48 hours for paddy and maize fields following light irrigation.',
          data: { severityLevel: 'normal' }
        },
        {
          userId: req.userId,
          type: 'disease_alert',
          priority: 'medium',
          title: 'Regional Pest Sentinel: Fall Armyworm Early Warning',
          message: 'Neighboring agricultural blocks reported sporadic Fall Armyworm egg masses in whorls of young maize plants. Inspect leaf undersides during early morning.',
          data: { disease: 'Fall Armyworm', severityLevel: 'medium' }
        },
        {
          userId: req.userId,
          type: 'tip',
          priority: 'low',
          title: 'Optimal Spray Window Today: 07:00 AM - 10:30 AM',
          message: 'Wind speed is under 11 km/h with no rain forecast for the next 6 hours. Ideal window for preventive bio-fungicide or micronutrient foliar application.',
          data: { weatherCondition: 'Clear Sky', severityLevel: 'low' }
        }
      ];

      await Notification.insertMany(initialAlerts);
      total = initialAlerts.length;
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    const unreadCount = await Notification.countDocuments({ userId: req.userId, read: false });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total }
    });
  } catch (error) { logger.error('Get notifications error:', error); next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, error: 'Not found' });
    res.status(200).json({ success: true, notification });
  } catch (error) { logger.error('Mark read error:', error); next(error); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.userId, read: false }, { $set: { read: true, readAt: new Date() } });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { logger.error('Mark all read error:', error); next(error); }
};

const subscribe = async (req, res, next) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) return res.status(400).json({ success: false, error: 'Push token required' });
    await User.findByIdAndUpdate(req.userId, { $set: { pushToken } });
    res.status(200).json({ success: true, message: 'Subscribed to notifications' });
  } catch (error) { logger.error('Subscribe error:', error); next(error); }
};

const updateSettings = async (req, res, next) => {
  try {
    const { enabled, frequency, quietHours, types } = req.body;
    const updates = {};
    if (typeof enabled === 'boolean') updates['notificationPreferences.enabled'] = enabled;
    if (['6h', '12h', 'daily'].includes(frequency)) updates['notificationPreferences.frequency'] = frequency;
    if (quietHours) {
      if (quietHours.start) updates['notificationPreferences.quietHours.start'] = quietHours.start;
      if (quietHours.end) updates['notificationPreferences.quietHours.end'] = quietHours.end;
    }
    if (types) {
      if (typeof types.diseaseAlerts === 'boolean') updates['notificationPreferences.types.diseaseAlerts'] = types.diseaseAlerts;
      if (typeof types.weatherAlerts === 'boolean') updates['notificationPreferences.types.weatherAlerts'] = types.weatherAlerts;
      if (typeof types.tips === 'boolean') updates['notificationPreferences.types.tips'] = types.tips;
    }
    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true });
    res.status(200).json({ success: true, message: 'Notification settings updated', notificationPreferences: user.notificationPreferences });
  } catch (error) { logger.error('Update notification settings error:', error); next(error); }
};

const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!notification) return res.status(404).json({ success: false, error: 'Not found' });
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) { logger.error('Delete notification error:', error); next(error); }
};

const { runWeatherAlertCheck, triggerTestDisasterAlert } = require('../services/cronService');

const getActiveAlert = async (req, res, next) => {
  try {
    // Look for unread critical / high disaster alerts from the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeAlert = await Notification.findOne({
      userId: req.userId,
      type: 'disaster_alert',
      priority: { $in: ['critical', 'high'] },
      read: false,
      createdAt: { $gte: since }
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, activeAlert });
  } catch (error) { logger.error('Get active alert error:', error); next(error); }
};

const triggerWeatherCheck = async (req, res, next) => {
  try {
    const result = await runWeatherAlertCheck();
    res.status(200).json({ success: true, message: '2-Hour Weather Evaluation executed', result });
  } catch (error) { logger.error('Trigger weather check error:', error); next(error); }
};

const triggerTestDisaster = async (req, res, next) => {
  try {
    const { disasterType } = req.body;
    const alert = await triggerTestDisasterAlert(req.userId, disasterType || 'flood');
    res.status(201).json({ success: true, message: 'Simulated High Red Alert triggered', alert });
  } catch (error) { logger.error('Trigger test disaster error:', error); next(error); }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  subscribe,
  updateSettings,
  deleteNotification,
  getActiveAlert,
  triggerWeatherCheck,
  triggerTestDisaster
};
