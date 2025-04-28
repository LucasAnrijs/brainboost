/**
 * Card Routes
 * Handles API endpoints related to flashcards
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth.middleware');
const { validate } = require('../../../middleware/validation');
const { apiLimiter } = require('../../../middleware/rate-limiter');
const cardController = require('./card.controller');
const cardValidation = require('./card.validation');

/**
 * @route POST /api/v1/cards/:deckId
 * @description Create a new card in a deck
 * @access Private
 */
router.post(
  '/:deckId',
  authenticate,
  validate(cardValidation.createCard),
  cardController.createCard
);

/**
 * @route GET /api/v1/cards/:deckId
 * @description Get all cards in a deck
 * @access Private (owner, collaborator, or public deck)
 */
router.get(
  '/:deckId',
  authenticate,
  validate(cardValidation.getCardsByDeckQuery, 'query'),
  cardController.getCardsByDeck
);

/**
 * @route GET /api/v1/cards/card/:id
 * @description Get a specific card by ID
 * @access Private (owner, collaborator, or public deck)
 */
router.get(
  '/card/:id',
  authenticate,
  cardController.getCardById
);

/**
 * @route PUT /api/v1/cards/:id
 * @description Update a card
 * @access Private (owner, card creator, or editor)
 */
router.put(
  '/:id',
  authenticate,
  validate(cardValidation.updateCard),
  cardController.updateCard
);

/**
 * @route DELETE /api/v1/cards/:id
 * @description Delete a card
 * @access Private (owner, card creator, or editor)
 */
router.delete(
  '/:id',
  authenticate,
  cardController.deleteCard
);

/**
 * @route POST /api/v1/cards/:deckId/bulk
 * @description Create multiple cards at once
 * @access Private (owner or editor)
 */
router.post(
  '/:deckId/bulk',
  authenticate,
  validate(cardValidation.bulkCreateCards),
  cardController.bulkCreateCards
);

/**
 * @route PUT /api/v1/cards/:id/reorder
 * @description Reorder a card within a deck
 * @access Private (owner or editor)
 */
router.put(
  '/:id/reorder',
  authenticate,
  validate(cardValidation.reorderCard),
  cardController.reorderCard
);

/**
 * @route PUT /api/v1/cards/:id/flags
 * @description Update card flags (suspended, marked, etc.)
 * @access Private (owner, card creator, or editor)
 */
router.put(
  '/:id/flags',
  authenticate,
  validate(cardValidation.updateCardFlags),
  cardController.updateCardFlags
);

/**
 * @route PUT /api/v1/cards/:id/move
 * @description Move a card to a different deck
 * @access Private (owner, card creator, or editor)
 */
router.put(
  '/:id/move',
  authenticate,
  validate(cardValidation.moveCard),
  cardController.moveCard
);

/**
 * @route POST /api/v1/cards/:id/clone
 * @description Clone a card to another deck
 * @access Private (with view access to source and edit access to target)
 */
router.post(
  '/:id/clone',
  authenticate,
  validate(cardValidation.cloneCard),
  cardController.cloneCard
);

module.exports = router;
