const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const chatbotController = require('../controllers/chatbotController');

router.post('/message', auth, chatbotController.chat);

module.exports = router;
