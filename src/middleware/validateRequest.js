const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array();
    const message = errorList.map(e => e.msg).filter(Boolean).join('. ') || 'Validation error';
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message,
      details: errorList
    });
  }
  next();
};

module.exports = { validateRequest };
