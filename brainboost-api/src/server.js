require('dotenv').config();

try {
  // All requires at the top level
  const express = require('express');
  const mongoose = require('mongoose');
  const helmet = require('helmet');
  const morgan = require('morgan');
  const cookieParser = require('cookie-parser');
  const compression = require('compression');
  const { errorHandler } = require('./middleware/error-handler');
  const { apiLimiter } = require('./middleware/rate-limiter');
  const requestLogger = require('./middleware/request-logger');
  const corsMiddleware = require('./middleware/cors');
  const responseFormatter = require('./middleware/response-formatter');
  const { paginate } = require('./middleware/pagination');
  const config = require('./config/app');
  const { logger, httpLogger } = require('./utils/logging/logger');
  const { initializeDatabase } = require('./config/database');

  // Import routes
  const authRoutes = require('./api/v1/auth/auth.routes');
  const userRoutes = require('./api/v1/users/user.routes');
  const deckRoutes = require('./api/v1/decks/deck.routes');
  const cardRoutes = require('./api/v1/cards/card.routes');
  const reviewRoutes = require('./api/v1/reviews/review.routes');
  console.log('All requires succeeded!');

  console.log('Starting server...');
  
  // Initialize express app
  const app = express();
  
  // Apply security middlewares
  console.log('Applying helmet...');
  app.use(helmet()); // Security headers with customized settings
  
  console.log('Applying corsMiddleware...');
  app.use(corsMiddleware); // CORS configuration
  
  // Apply body parsers and cookie parser
  console.log('Applying body parsers...');
  app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
  app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL encoded bodies
  app.use(cookieParser()); // Parse cookies
  
  // Apply compression for all responses
  console.log('Applying compression...');
  app.use(compression());
  
  // Apply response formatter middleware
  console.log('Applying responseFormatter...');
  app.use(responseFormatter);
  
  // Apply global pagination middleware
  console.log('Applying pagination...');
  app.use(paginate({
    defaultLimit: 10,
    maxLimit: 100,
  }));
  
  // Apply request logging middleware
  console.log('Applying morgan...');
  if (config.server.env === 'development') {
    app.use(morgan('dev', { stream: httpLogger })); // HTTP request logging
  } else {
    app.use(morgan('combined', {
      // Skip successful requests in production to reduce log volume
      skip: (req, res) => res.statusCode < 400,
      stream: httpLogger
    }));
  }
  
  // Apply detailed request logger
  console.log('Applying requestLogger...');
  app.use(requestLogger);
  
  // Apply API rate limiting to all routes
  console.log('Applying apiLimiter...');
  app.use('/api/', apiLimiter);
  
  // API version prefix
  const API_PREFIX = '/api/v1';
  
  // Apply routes with prefix
  console.log('Registering routes...');
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/users`, userRoutes);
  app.use(`${API_PREFIX}/decks`, deckRoutes);
  app.use(`${API_PREFIX}/cards`, cardRoutes);
  app.use(`${API_PREFIX}/reviews`, reviewRoutes);
  
  // Health check endpoint (no authentication required)
  console.log('Registering health check...');
  app.get('/health', (req, res) => {
    res.json({ 
      version: process.env.npm_package_version || '1.0.0',
      environment: config.server.env,
      uptime: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
      message: 'Server is running'
    });
  });
  
  // Global 404 handler for undefined routes
  console.log('Registering 404 handler...');
  app.all('*', (req, res) => {
    res.status(404).json({ error: `Route ${req.originalUrl} not found` });
  });
  
  // Apply global error handler middleware
  console.log('Applying error handler...');
  app.use(errorHandler);
  
  console.log('Finished Express setup.');
  
  // Connect to database and start server
  const startServer = async () => {
    try {
      await initializeDatabase();
      const PORT = config.server.port || 5005;
      console.log('About to start server on port', PORT);
      app.listen(PORT, () => {
        console.log('Server started on port', PORT);
        // logger.info(`Server running in ${config.server.env} mode on port ${PORT}`);
        // logger.info(`API URL: http://localhost:${PORT}${API_PREFIX}`);
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  };
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Always crash on uncaught exceptions as the app state is undefined
    process.exit(1);
  });
  
  // Handle SIGTERM (e.g., from Docker, Kubernetes)
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    // Close server and database connections
    mongoose.connection.close();
    process.exit(0);
  });
  
  // Start the server
  startServer();
  
  module.exports = app; // Export for testing.
} catch (err) {
  console.error('Top-level error:', err);
}
