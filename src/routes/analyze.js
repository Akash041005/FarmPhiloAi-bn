const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const analyzeController = require('../controllers/analyzeController');

router.post('/', auth, analyzeController.upload.single('image'), analyzeController.analyze);
router.get('/cache/stats', auth, analyzeController.getCacheStats);
router.post('/voice', auth, analyzeController.analyzeVoice);

module.exports = router;
