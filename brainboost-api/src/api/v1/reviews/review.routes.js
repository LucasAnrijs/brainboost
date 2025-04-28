/**
 * Review Routes
 * Handles API endpoints related to card reviews and SRS functionality
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validation');
const { apiLimiter } = require('../../../middleware/rate-limiter');
const reviewController = require('./review.controller');
const reviewValidation = require('./review.validation');

/**
 * @route POST /api/v1/reviews
 * @description Submit a review result for a card
 * @access Private
 */
router.post(
  '/',
  (req, res) => res.send('ok')
);

/**
 * @route GET /api/v1/reviews/due
 * @description Get cards due for review
 * @access Private
 */
router.get(
  '/due',
  authenticate,
  validate(reviewValidation.getDueCards, 'query'),
  reviewController.getDueCards
);

/**
 * @route POST /api/v1/reviews/sessions
 * @description Start a new review session
 * @access Private
 */
router.post(
  '/sessions',
  authenticate,
  validate(reviewValidation.startSession),
  reviewController.startSession
);

/**
 * @route GET /api/v1/reviews/sessions/:id
 * @description Get review session details by ID
 * @access Private
 */
router.get(
  '/sessions/:id',
  authenticate,
  reviewController.getSessionById
);

/**
 * @route GET /api/v1/reviews/stats
 * @description Get user study statistics
 * @access Private
 */
router.get(
  '/stats',
  authenticate,
  validate(reviewValidation.getStudyStats, 'query'),
  reviewController.getStudyStats
);

/**
 * @route POST /api/v1/reviews/reset/:cardId
 * @description Reset a card's progress back to new state
 * @access Private
 */
router.post(
  '/reset/:cardId',
  authenticate,
  reviewController.resetCardProgress
);

module.exports = router;
