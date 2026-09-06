const express = require('express');
const router = express.Router();
const { mlPredict } = require('../controllers/mlController');

router.post('/predict', mlPredict);

module.exports = router;
