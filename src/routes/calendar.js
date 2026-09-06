const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const calendarController = require('../controllers/calendarController');

router.get('/', auth, calendarController.getCalendar);
router.get('/regions', auth, calendarController.getRegions);
router.get('/current-season', auth, calendarController.getCurrentSeason);

module.exports = router;
