const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const cropController = require('../controllers/cropController');

router.post('/recommend', auth, cropController.recommendCrop);
router.get('/recommendations', auth, cropController.getRecommendations);
router.get('/recommendations/:id', auth, cropController.getRecommendationById);
router.delete('/recommendations/:id', auth, cropController.deleteRecommendation);

module.exports = router;
