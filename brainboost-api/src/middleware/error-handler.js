const { logger } = require('../utils/logging/logger');
const { AppError } = require('../utils/errors/app-error');
const config = require('../config/app');

/**
 * Global error handler middleware
 * Provides consistent error responses across the API
 */
const errorHandler = (err, req, res, next) => {
  // Clone error object to avoid modifying the original
  const error = {
    statusCode: err.statusCode || 500,
    status: err.status || 'error',
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
    stack: err.stack,
  };

  // Log the error with appropriate level
  if (error.statusCode >= 500) {
    logger.error(`${error.statusCode} - ${error.message}`, { 
      path: req.path,
      method: req.method,
      ip: req.ip,
      stack: error.stack,
    });
  } else {
    logger.warn(`${error.statusCode} - ${error.message}`, { 
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }

  // Handle specific error types
  if (err instanceof AppError) {
    // AppError is already properly formatted
  } else if (err.name === 'ValidationError' && err.errors) {
    // Mongoose validation error
    error.statusCode = 400;
    error.message = 'Validation Error';
    error.errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ID)
    error.statusCode = 400;
    error.message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    error.statusCode = 409;
    error.message = 'Duplicate field value entered';
    
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error.errors = [{
      field,
      message: `${field} '${value}' already exists`
    }];
  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    error.statusCode = 401;
    error.message = 'Invalid token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired
    error.statusCode = 401;
    error.message = 'Your token has expired. Please log in again.';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    // Multer file size limit
    error.statusCode = 400;
    error.message = 'File too large. Maximum size is 10MB.';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    // Multer unexpected field
    error.statusCode = 400;
    error.message = 'Unexpected field in file upload.';
  }

  // Prepare the response object
  const response = {
    status: error.statusCode < 500 ? 'error' : 'fail',
    message: error.message,
  };

  // Add errors array if there are validation errors
  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors;
  }

  // Add stack trace in development mode only
  if (config.server.env === 'development') {
    response.stack = error.stack;
  }

  // Add request info in development mode
  if (config.server.env === 'development') {
    response.request = {
      path: req.path,
      method: req.method,
      body: req.body ? JSON.stringify(req.body).substring(0, 1000) : null, // Limit size
      query: req.query,
    };
  }

  // Send error response
  res.status(error.statusCode).json(response);
};

module.exports = {
  errorHandler
};
