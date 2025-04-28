/**
 * Deck Validation Schemas
 * Defines validation rules for deck-related API endpoints
 */

const Joi = require('joi');
const { commonValidation } = require('../../../middleware/validation');

// Create deck validation schema
const createDeck = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500),
  tags: Joi.array().items(Joi.string().trim()),
  category: Joi.string().trim(),
  visibility: Joi.string().valid('private', 'shared', 'public').default('private'),
  coverImage: Joi.string().uri().allow(null, ''),
  settings: Joi.object({
    newCardsPerDay: Joi.number().integer().min(1).max(100),
    reviewsPerDay: Joi.number().integer().min(1).max(1000),
    orderNewCards: Joi.string().valid('order_added', 'random'),
    orderReviews: Joi.string().valid('due_date', 'random', 'difficulty')
  })
});

// Update deck validation schema
const updateDeck = Joi.object({
  title: Joi.string().min(3).max(100),
  description: Joi.string().max(500).allow(''),
  tags: Joi.array().items(Joi.string().trim()),
  category: Joi.string().trim().allow(''),
  visibility: Joi.string().valid('private', 'shared', 'public'),
  coverImage: Joi.string().uri().allow(null, ''),
  settings: Joi.object({
    newCardsPerDay: Joi.number().integer().min(1).max(100),
    reviewsPerDay: Joi.number().integer().min(1).max(1000),
    orderNewCards: Joi.string().valid('order_added', 'random'),
    orderReviews: Joi.string().valid('due_date', 'random', 'difficulty')
  })
});

// Toggle visibility validation schema
const toggleVisibility = Joi.object({
  visibility: Joi.string().valid('private', 'shared', 'public').required()
});

// Archive validation schema
const toggleArchive = Joi.object({
  archived: Joi.boolean().required()
});

// Add collaborator validation schema
const addCollaborator = Joi.object({
  userId: commonValidation.objectId.required(),
  role: Joi.string().valid('viewer', 'editor', 'admin').required()
});

// Update collaborator validation schema
const updateCollaborator = Joi.object({
  role: Joi.string().valid('viewer', 'editor', 'admin').required()
});

// Copy deck validation schema
const copyDeck = Joi.object({
  title: Joi.string().min(3).max(100)
});

// Get decks query validation schema
const getDecksQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(100),
  tag: Joi.string(),
  category: Joi.string(),
  visibility: Joi.string().valid('private', 'shared', 'public'),
  archived: Joi.boolean().default(false),
  sort: Joi.string().valid('title', 'createdAt', 'updatedAt', 'lastStudied').default('updatedAt'),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

// Public decks query validation schema
const getPublicDecksQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(100),
  tag: Joi.string(),
  category: Joi.string(),
  sort: Joi.string().valid('title', 'createdAt', 'updatedAt', 'studyCount').default('updatedAt'),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

module.exports = {
  createDeck,
  updateDeck,
  toggleVisibility,
  toggleArchive,
  addCollaborator,
  updateCollaborator,
  copyDeck,
  getDecksQuery,
  getPublicDecksQuery
};
