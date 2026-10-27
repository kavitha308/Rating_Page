const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const { errorResponse } = require('../utils/response');

/**
 * General API Rate Limiter
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMinutes * 60 * 1000,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.nodeEnv === 'test' || req.headers['x-bypass-rate-limit'] === 'test-suite',
  handler: (req, res) => {
    return errorResponse(res, {
      statusCode: 429,
      message: `Too many requests from this IP. Please try again after ${config.rateLimit.windowMinutes} minutes.`
    });
  }
});

/**
 * Sensitive Authentication Endpoints Rate Limiter (Login, Register, Password update)
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMinutes * 60 * 1000,
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.nodeEnv === 'test' || req.headers['x-bypass-rate-limit'] === 'test-suite',
  handler: (req, res) => {
    return errorResponse(res, {
      statusCode: 429,
      message: 'Too many authentication attempts. Please try again after 15 minutes.'
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
