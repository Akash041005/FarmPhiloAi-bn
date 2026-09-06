const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../utils/logger');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });
};

const register = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email already registered', message: 'An account with this email already exists' });
    }
    const user = await User.create({ email, password, name, phone });
    const token = generateToken(user._id);
    logger.info(`New user registered: ${user.email}`);
    res.status(201).json({
      success: true, message: 'Registration successful',
      user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role, language: user.language, theme: user.theme },
      token, expiresIn: '30d'
    });
  } catch (error) { logger.error('Registration error:', error); next(error); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials', message: 'Invalid email or password' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials', message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Account disabled', message: 'Your account has been disabled' });
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user._id);
    res.json({
      success: true, message: 'Login successful',
      user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role, location: user.location, language: user.language, theme: user.theme, phone: user.phone, notificationPreferences: user.notificationPreferences },
      token, expiresIn: '30d'
    });
  } catch (error) { logger.error('Login error:', error); next(error); }
};

const getProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Email not found', message: 'No account found with this email' });
    }
    const resetToken = jwt.sign({ userId: user._id, type: 'password-reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, message: 'Password reset instructions sent to your email' });
  } catch (error) { logger.error('Forgot password error:', error); next(error); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({ success: false, error: 'Invalid token', message: 'Invalid or expired reset token' });
    }
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found', message: 'User not found' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ success: false, error: 'Invalid token', message: 'Invalid or expired reset token' });
    }
    logger.error('Reset password error:', error); next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, language, theme } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (language) updates.language = language;
    if (theme) updates.theme = theme;
    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated successfully', user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role, language: user.language, theme: user.theme } });
  } catch (error) { logger.error('Profile update error:', error); next(error); }
};

module.exports = { register, login, getProfile, forgotPassword, resetPassword, updateProfile };
