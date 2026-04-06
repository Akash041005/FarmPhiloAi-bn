const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: 'Too many requests',
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip} on route: ${req.path}`);
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message
      });
    }
  });
};

const authLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many authentication attempts, please try again later'
);

const analyzeLimiter = createLimiter(
  60 * 60 * 1000,
  20,
  'Too many analysis requests, please try again later'
);

const apiLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Too many requests from this IP, please try again later'
);

module.exports = {
  authLimiter,
  analyzeLimiter,
  apiLimiter
};