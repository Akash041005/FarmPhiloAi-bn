const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const historyController = require('../controllers/historyController');

router.get('/', auth, historyController.getHistory);
router.get('/stats/summary', auth, historyController.getStats);
router.get('/:id', auth, historyController.getHistoryById);
router.delete('/:id', auth, historyController.deleteHistory);
router.patch('/:id/bookmark', auth, historyController.toggleBookmark);
router.patch('/:id/tags', auth, historyController.updateTags);

module.exports = router;
