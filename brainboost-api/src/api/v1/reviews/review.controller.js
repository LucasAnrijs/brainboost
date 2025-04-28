/**
 * Review Controller
 * Handles API requests related to card reviews and SRS functionality
 */

const { srsService } = require('../../../services/srs-service');
const { cardService } = require('../../../services/card-service');
const { AppError, notFound } = require('../../../utils/errors/app-error');
const logger = require('../../../utils/logging/logger').logger;

/**
 * Submit a review result for a card
 * @route POST /api/v1/reviews
 */
const submitReview = async (req, res, next) => {
  try {
    const { cardId, isCorrect, responseTime, confidence, sessionId } = req.body;
    const userId = req.user.id;

    // Validate that the card exists
    const card = await cardService.getCardById(cardId);
    if (!card) {
      return next(notFound(`Card with id ${cardId} not found`));
    }

    // Create performance object from request data
    const performance = {
      isCorrect,
      responseTime,
      confidence: confidence || 0.5 // Default to neutral confidence if not provided
    };

    // Create context object with device and review type information
    const context = {
      deviceType: req.headers['user-agent'] ? 
                 getDeviceType(req.headers['user-agent']) : 'unknown',
      reviewType: 'scheduled',
      location: req.body.location // Optional location data
    };

    // Process the review with the SRS algorithm
    const reviewData = {
      performance,
      context,
      sessionId
    };

    const result = await srsService.processReviewResult(userId, cardId, reviewData);

    // Return the updated card state
    return res.success(result, 'Review processed successfully');
  } catch (error) {
    logger.error('Error processing review:', error);
    return next(error);
  }
};

/**
 * Get cards due for review
 * @route GET /api/v1/reviews/due
 */
const getDueCards = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const deckId = req.query.deckId; // Optional deck filter
    
    // Parse options from query parameters
    const options = {
      limit: parseInt(req.query.limit) || 20,
      includeNew: req.query.includeNew !== 'false', // Default to true
      newCardLimit: parseInt(req.query.newCardLimit) || 5,
      includeDetails: true
    };

    // Get due cards from SRS service
    const dueCards = await srsService.getDueCardsForUser(userId, deckId, options);

    return res.success({
      count: dueCards.length,
      cards: dueCards
    }, 'Due cards retrieved successfully');
  } catch (error) {
    logger.error('Error getting due cards:', error);
    return next(error);
  }
};

/**
 * Start a new review session
 * @route POST /api/v1/reviews/sessions
 */
const startSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { deckId, timeLimit, cardLimit } = req.body;

    // Create a new session with specified parameters
    const session = await srsService.createSession(userId, {
      deckId,
      timeLimit, // Optional time limit in minutes
      cardLimit  // Optional card limit
    });

    return res.success(session, 'Review session created');
  } catch (error) {
    logger.error('Error creating review session:', error);
    return next(error);
  }
};

/**
 * Get review session details by ID
 * @route GET /api/v1/reviews/sessions/:id
 */
const getSessionById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    // Get session details
    const session = await srsService.getSessionById(sessionId);

    // Check if session exists and belongs to user
    if (!session) {
      return next(notFound(`Session with id ${sessionId} not found`));
    }

    if (session.userId.toString() !== userId) {
      return next(new AppError('You are not authorized to access this session', 403));
    }

    return res.success(session, 'Session retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving session:', error);
    return next(error);
  }
};

/**
 * Get user study statistics
 * @route GET /api/v1/reviews/stats
 */
const getStudyStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const deckId = req.query.deckId; // Optional deck filter
    
    // Get user statistics from SRS service
    const stats = await srsService.getUserStatistics(userId, deckId);

    return res.success(stats, 'Study statistics retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving study statistics:', error);
    return next(error);
  }
};

/**
 * Reset card progress back to new state
 * @route POST /api/v1/reviews/reset/:cardId
 */
const resetCardProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;

    // Validate that the card exists
    const card = await cardService.getCardById(cardId);
    if (!card) {
      return next(notFound(`Card with id ${cardId} not found`));
    }

    // Reset the card progress
    const result = await srsService.resetCardProgress(userId, cardId);

    if (!result) {
      return res.success(null, 'Card had no progress to reset');
    }

    return res.success(result, 'Card progress reset successfully');
  } catch (error) {
    logger.error('Error resetting card progress:', error);
    return next(error);
  }
};

/**
 * Helper function to determine device type from user agent
 */
function getDeviceType(userAgent) {
  if (/mobile/i.test(userAgent)) {
    return 'mobile';
  } else if (/tablet/i.test(userAgent)) {
    return 'tablet';
  } else if (/windows|macintosh|linux/i.test(userAgent)) {
    return 'desktop';
  } else {
    return 'unknown';
  }
}

module.exports = {
  submitReview,
  getDueCards,
  startSession,
  getSessionById,
  getStudyStats,
  resetCardProgress,
  createReview: async (req, res) => {
    // implementation
  }
};
