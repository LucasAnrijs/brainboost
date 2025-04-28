const { logger } = require('../utils/logging/logger');
const config = require('../config/app');

/**
 * Middleware for detailed request logging
 * Logs request details and response time
 */
const requestLogger = (req, res, next) => {
  // Skip logging for health check endpoints to reduce noise
  if (req.originalUrl === '/health') {
    return next();
  }
  
  // Record start time
  const start = Date.now();
  
  // Create a copy of the request
  const requestCopy = {
    method: req.method,
    url: req.originalUrl,
    headers: {
      ...req.headers,
      // Remove sensitive headers
      authorization: req.headers.authorization ? '[REDACTED]' : undefined,
      cookie: req.headers.cookie ? '[REDACTED]' : undefined,
    },
    body: sanitizeRequestBody(req.body),
    query: req.query,
    ip: req.ip,
  };
  
  // Log incoming request at debug level
  logger.debug(`Request received: ${req.method} ${req.originalUrl}`, {
    request: requestCopy,
  });
  
  // Add response finished listener
  res.on('finish', () => {
    // Calculate request duration
    const duration = Date.now() - start;
    
    // Determine log level based on status code
    let logLevel = 'info';
    if (res.statusCode >= 500) {
      logLevel = 'error';
    } else if (res.statusCode >= 400) {
      logLevel = 'warn';
    } else if (res.statusCode >= 300) {
      logLevel = 'verbose';
    }
    
    // Log at appropriate level
    logger[logLevel](
      `Response: ${res.statusCode} ${req.method} ${req.originalUrl} (${duration}ms)`,
      {
        request: {
          method: req.method,
          url: req.originalUrl,
        },
        response: {
          statusCode: res.statusCode,
          duration,
        },
      }
    );
  });
  
  next();
};

/**
 * Sanitize request body to remove sensitive information
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
function sanitizeRequestBody(body) {
  // Return early if no body or not in development mode
  if (!body || typeof body !== 'object' || config.server.env !== 'development') {
    return '[REDACTED]';
  }
  
  // Create a copy of the body
  const sanitized = { ...body };
  
  // List of sensitive fields to redact
  const sensitiveFields = [
    'password',
    'currentPassword',
    'newPassword',
    'confirmPassword',
    'passwordConfirmation',
    'secret',
    'token',
    'refreshToken',
    'accessToken',
    'credit_card',
    'creditCard',
    'cardNumber',
    'cvv',
    'pin',
  ];
  
  // Redact sensitive fields
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

module.exports = requestLogger;
