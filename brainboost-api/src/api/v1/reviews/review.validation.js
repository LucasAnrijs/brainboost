/**
 * Review Validation Schemas
 * Defines validation rules for review-related API endpoints
 */

const Joi = require('joi');
const { commonValidation } = require('../../../middleware/validation');

// Submit a review result validation
const submitReview = Joi.object({
  cardId: commonValidation.objectId.required(),
  isCorrect: Joi.boolean().required(),
  responseTime: Joi.number().integer().min(0).max(300000).required(), // Max 5 minutes in milliseconds
  confidence: Joi.number().min(0).max(1).default(0.5), // Optional confidence score (0-1)
  sessionId: commonValidation.objectId, // Optional session ID
  location: Joi.string().max(100), // Optional location data
  metadata: Joi.object().unknown(true) // Optional additional metadata
});

// Get due cards validation
const getDueCards = Joi.object({
  deckId: commonValidation.objectId, // Optional deck filter
  limit: Joi.number().integer().min(1).max(100).default(20),
  includeNew: Joi.boolean().default(true),
  newCardLimit: Joi.number().integer().min(0).max(50).default(5)
});

// Start session validation
const startSession = Joi.object({
  deckId: commonValidation.objectId, // Optional deck filter
  timeLimit: Joi.number().integer().min(1).max(120), // Optional time limit in minutes (max 2 hours)
  cardLimit: Joi.number().integer().min(1).max(500) // Optional card limit
});

// Get study stats validation
const getStudyStats = Joi.object({
  deckId: commonValidation.objectId, // Optional deck filter
  period: Joi.string().valid('day', 'week', 'month', 'year', 'all').default('all'),
  startDate: Joi.date(),
  endDate: Joi.date().min(Joi.ref('startDate'))
});

module.exports = {
  submitReview,
  getDueCards,
  startSession,
  getStudyStats,
};
