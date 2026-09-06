const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const authController = require('../controllers/authController');

router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required')
], validateRequest, authController.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], validateRequest, authController.login);

router.get('/me', auth, authController.getProfile);

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], validateRequest, authController.forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], validateRequest, authController.resetPassword);

router.put('/profile', auth, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('language').optional().isIn(['en', 'hi', 'te']).withMessage('Invalid language'),
  body('theme').optional().isIn(['light', 'dark', 'auto']).withMessage('Invalid theme')
], validateRequest, authController.updateProfile);

module.exports = router;
