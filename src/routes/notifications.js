const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.get('/', auth, notificationController.getNotifications);
router.get('/active-alert', auth, notificationController.getActiveAlert);
router.post('/weather-check', auth, notificationController.triggerWeatherCheck);
router.post('/test-disaster', auth, notificationController.triggerTestDisaster);
router.put('/read-all', auth, notificationController.markAllAsRead);
router.put('/:id/read', auth, notificationController.markAsRead);
router.post('/subscribe', auth, notificationController.subscribe);
router.put('/settings', auth, notificationController.updateSettings);
router.delete('/:id', auth, notificationController.deleteNotification);

module.exports = router;
