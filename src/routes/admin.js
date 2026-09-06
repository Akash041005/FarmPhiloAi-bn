const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

router.get('/stats', auth, adminAuth, adminController.getStats);
router.get('/users', auth, adminAuth, adminController.getUsers);
router.delete('/users/:id', auth, adminAuth, adminController.deleteUser);

module.exports = router;
