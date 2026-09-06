const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const fertilizerController = require('../controllers/fertilizerController');

router.get('/', auth, fertilizerController.getFertilizers);
router.post('/calculate', auth, fertilizerController.calculateFertilizer);
router.post('/recommend', auth, fertilizerController.recommendFertilizer);
router.get('/:id', auth, fertilizerController.getFertilizerById);

module.exports = router;
