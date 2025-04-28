const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logging/logger');
const config = require('../config/app');

/**
 * Determines rate limit window and maximum requests based on environment
 */
const getRateLimitOptions = () => {
  // Different limits based on environment
  if (config.server.env === 'production') {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes in production
      max: 100, // 100 requests per window per IP
    };
  } else {
    return {
      windowMs: 5 * 60 * 1000, // 5 minutes in development
      max: 300, // 300 requests per window per IP
    };
  }
};

/**
 * Base rate limiter configuration
 */
const baseOptions = {
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting in test environment
  skip: () => config.server.env === 'test',
  // Handler when rate limit is exceeded
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded: ${req.ip} - ${req.method} ${req.originalUrl}`);
    res.status(options.statusCode).json({
      status: 'error',
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil(options.windowMs / 1000 / 60), // Minutes until retry is possible
    });
  },
};

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  ...baseOptions,
  ...getRateLimitOptions(),
});

/**
 * More strict rate limiter for auth routes
 */
const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later',
  },
});

/**
 * Strict rate limiter for sensitive operations
 */
const sensitiveRouteLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    status: 'error',
    message: 'Too many requests for sensitive operation, please try again later',
  },
});

/**
 * Custom rate limiter for specific resources
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum number of requests per window
 * @param {string} message - Error message
 * @returns {Function} Rate limiter middleware
 */
const customLimiter = (windowMs, max, message) => {
  return rateLimit({
    ...baseOptions,
    windowMs,
    max,
    message: {
      status: 'error',
      message: message || 'Too many requests, please try again later',
    },
  });
};

module.exports = {
  apiLimiter,
  authLimiter,
  sensitiveRouteLimiter,
  customLimiter,
};
