/**
 * Deck Routes
 * Handles API endpoints related to flashcard decks
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth.middleware');
const { validate } = require('../../../middleware/validation');
const { apiLimiter } = require('../../../middleware/rate-limiter');
const deckController = require('./deck.controller');
const deckValidation = require('./deck.validation');

// Public deck routes
/**
 * @route GET /api/v1/decks/public
 * @description Get public decks
 * @access Public
 */
router.get(
  '/public',
  validate(deckValidation.getPublicDecksQuery, 'query'),
  deckController.getPublicDecks
);

/**
 * @route POST /api/v1/decks
 * @description Create a new deck
 * @access Private
 */
router.post(
  '/',
  authenticate,
  validate(deckValidation.createDeck),
  deckController.createDeck
);

/**
 * @route GET /api/v1/decks
 * @description Get all decks for the current user
 * @access Private
 */
router.get(
  '/',
  authenticate,
  validate(deckValidation.getDecksQuery, 'query'),
  deckController.getDecks
);

/**
 * @route GET /api/v1/decks/:id
 * @description Get a specific deck by ID
 * @access Private (owner, collaborator, or public)
 */
router.get(
  '/:id',
  authenticate,
  deckController.getDeckById
);

/**
 * @route PUT /api/v1/decks/:id
 * @description Update a deck
 * @access Private (owner or editor)
 */
router.put(
  '/:id',
  authenticate,
  validate(deckValidation.updateDeck),
  deckController.updateDeck
);

/**
 * @route DELETE /api/v1/decks/:id
 * @description Delete a deck
 * @access Private (owner only)
 */
router.delete(
  '/:id',
  authenticate,
  deckController.deleteDeck
);

/**
 * @route PUT /api/v1/decks/:id/visibility
 * @description Toggle deck visibility (public/private)
 * @access Private (owner only)
 */
router.put(
  '/:id/visibility',
  authenticate,
  validate(deckValidation.toggleVisibility),
  deckController.toggleVisibility
);

/**
 * @route PUT /api/v1/decks/:id/archive
 * @description Archive or unarchive a deck
 * @access Private (owner only)
 */
router.put(
  '/:id/archive',
  authenticate,
  validate(deckValidation.toggleArchive),
  deckController.toggleArchive
);

/**
 * @route POST /api/v1/decks/:id/copy
 * @description Copy a public deck to user's collection
 * @access Private
 */
router.post(
  '/:id/copy',
  authenticate,
  validate(deckValidation.copyDeck),
  deckController.copyDeck
);

/**
 * @route POST /api/v1/decks/:id/collaborators
 * @description Add a collaborator to a deck
 * @access Private (owner or admin)
 */
router.post(
  '/:id/collaborators',
  authenticate,
  validate(deckValidation.addCollaborator),
  deckController.addCollaborator
);

/**
 * @route PUT /api/v1/decks/:id/collaborators/:userId
 * @description Update a collaborator's role
 * @access Private (owner or admin)
 */
router.put(
  '/:id/collaborators/:userId',
  authenticate,
  validate(deckValidation.updateCollaborator),
  deckController.updateCollaborator
);

/**
 * @route DELETE /api/v1/decks/:id/collaborators/:userId
 * @description Remove a collaborator from a deck
 * @access Private (owner, admin, or self-remove)
 */
router.delete(
  '/:id/collaborators/:userId',
  authenticate,
  deckController.removeCollaborator
);

module.exports = router;
