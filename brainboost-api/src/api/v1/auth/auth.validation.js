const Joi = require('joi');

/**
 * Validation schemas for authentication endpoints
 */
const authValidation = {
  /**
   * Validation schema for user registration
   */
  register: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required',
      }),
    
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    
    password: Joi.string()
      .min(8)
      .max(100)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 100 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'Password is required',
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords must match',
        'any.required': 'Please confirm your password',
      }),
  }),
  
  /**
   * Validation schema for user login
   */
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required',
      }),
  }),
  
  /**
   * Validation schema for token refresh
   */
  refreshToken: Joi.object({
    refreshToken: Joi.string().messages({
      'string.base': 'Refresh token must be a string',
    }),
  }),
  
  /**
   * Validation schema for forgot password
   */
  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
  }),
  
  /**
   * Validation schema for password reset
   */
  resetPassword: Joi.object({
    password: Joi.string()
      .min(8)
      .max(100)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 100 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'Password is required',
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords must match',
        'any.required': 'Please confirm your password',
      }),
  }),
};

module.exports = authValidation;
