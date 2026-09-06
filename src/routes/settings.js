const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

router.get('/', auth, settingsController.getSettings);
router.put('/location', auth, settingsController.updateLocation);
router.put('/profile', auth, settingsController.updateProfile);
router.put('/preferences', auth, settingsController.updatePreferences);

module.exports = router;
