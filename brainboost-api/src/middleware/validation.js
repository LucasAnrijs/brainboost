const Joi = require('joi');
const { badRequest } = require('../utils/errors/app-error');
const { logger } = require('../utils/logging/logger');

/**
 * Middleware factory for request validation
 * Uses Joi schemas to validate request data
 * 
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    // If no schema provided, skip validation
    if (!schema) {
      return next();
    }
    
    const data = req[property];
    
    // Skip validation if property doesn't exist and schema is optional
    if (!data && schema._flags && schema._flags.presence !== 'required') {
      return next();
    }
    
    // Configure validation options
    const options = {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
      convert: true, // Allow type conversions
      errors: {
        wrap: { label: false }, // Don't wrap error labels in quotes
      },
    };
    
    // Validate data against schema
    const { error, value } = schema.validate(data, options);
    
    if (error) {
      // Format validation errors
      const errors = error.details.map(detail => {
        // Extract field name and message
        let field = detail.path.join('.');
        let message = detail.message;
        
        // Handle specific error types with better messages
        if (detail.type === 'any.required') {
          message = `${field} is required`;
        } else if (detail.type === 'string.min') {
          message = `${field} must be at least ${detail.context.limit} characters`;
        } else if (detail.type === 'string.max') {
          message = `${field} cannot exceed ${detail.context.limit} characters`;
        } else if (detail.type === 'string.email') {
          message = `${field} must be a valid email address`;
        }
        
        return { field, message };
      });
      
      // Log validation error
      logger.debug(`Validation error for ${req.method} ${req.path}`, { errors });
      
      return next(badRequest('Validation failed', errors));
    }
    
    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

/**
 * Global validation schemas for common patterns
 */
const commonValidation = {
  // MongoDB ObjectId validation
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Invalid ID format (must be a 24-character hex string)',
  }),
  
  // Pagination parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  }),
  
  // Search parameters
  search: Joi.object({
    q: Joi.string().min(1).max(100),
    fields: Joi.string(), // Comma-separated list of fields to search
  }),
};

module.exports = {
  validate,
  commonValidation,
};
