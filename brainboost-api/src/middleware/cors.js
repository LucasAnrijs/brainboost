const cors = require('cors');
const config = require('../config/app');
const { logger } = require('../utils/logging/logger');

/**
 * Configure CORS options based on environment
 * @returns {Object} CORS configuration options
 */
const getCorsOptions = () => {
  // Define allowed origins based on environment
  let allowedOrigins = [];
  
  // In production, use configured origin
  if (config.server.env === 'production') {
    // Allow specified client URL or fall back to localhost
    const clientUrl = config.server.clientUrl || 'https://brainboost.app';
    allowedOrigins = [clientUrl];
  } else {
    // In development, allow localhost on various ports
    allowedOrigins = [
      'http://localhost:3000',  // React default
      'http://localhost:5173',  // Vite default
      'http://localhost:8080',  // Webpack default
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
    ];
    
    // Add additional development URLs if configured
    if (config.server.additionalClientUrls) {
      allowedOrigins = [...allowedOrigins, ...config.server.additionalClientUrls];
    }
  }
  
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is allowed
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        // Log unauthorized origin attempts in production
        if (config.server.env === 'production') {
          logger.warn(`CORS blocked request from origin: ${origin}`);
        }
        
        // In development, allow all origins if configured
        if (config.server.env === 'development' && config.server.corsAllowAll) {
          return callback(null, true);
        }
        
        // Otherwise block the request
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // Allow cookies with CORS
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Auth-Token',
    ],
    exposedHeaders: ['Content-Range', 'X-Total-Count'], // For pagination
    maxAge: 86400, // Cache preflight request for 24 hours
  };
};

/**
 * CORS middleware setup with environment-specific configuration
 */
const corsMiddleware = cors(getCorsOptions());

module.exports = corsMiddleware;
