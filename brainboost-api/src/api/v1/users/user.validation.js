const Joi = require('joi');

/**
 * Validation schemas for user endpoints
 */
const userValidation = {
  /**
   * Validation schema for updating user profile
   */
  updateProfile: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters',
      }),
    
    profileImage: Joi.string()
      .uri()
      .allow(null, '')
      .messages({
        'string.uri': 'Profile image must be a valid URL',
      }),
  }),
  
  /**
   * Validation schema for updating user preferences
   */
  updatePreferences: Joi.object({
    preferences: Joi.object({
      theme: Joi.string()
        .valid('light', 'dark', 'system')
        .messages({
          'any.only': 'Theme must be light, dark, or system',
        }),
      
      studyGoal: Joi.number()
        .integer()
        .min(1)
        .max(500)
        .messages({
          'number.base': 'Study goal must be a number',
          'number.integer': 'Study goal must be an integer',
          'number.min': 'Study goal must be at least 1 card per day',
          'number.max': 'Study goal cannot exceed 500 cards per day',
        }),
      
      emailNotifications: Joi.boolean()
        .messages({
          'boolean.base': 'Email notifications must be a boolean',
        }),
      
      reminderTime: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .messages({
          'string.pattern.base': 'Reminder time must be in the format HH:MM',
        }),
    })
      .required()
      .messages({
        'object.base': 'Preferences must be an object',
        'any.required': 'Preferences is required',
      }),
  }),
  
  /**
   * Validation schema for updating user password
   */
  updatePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required',
      }),
    
    newPassword: Joi.string()
      .min(8)
      .max(100)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password cannot exceed 100 characters',
        'string.pattern.base':
          'New password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'New password is required',
      }),
    
    confirmNewPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Passwords must match',
        'any.required': 'Please confirm your new password',
      }),
  }),
  
  /**
   * Validation schema for deleting user account
   */
  deleteAccount: Joi.object({
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required to delete account',
      }),
  }),
};

module.exports = userValidation;
