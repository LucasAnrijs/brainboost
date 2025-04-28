/**
 * SRS Service
 * 
 * Provides functionality for spaced repetition scheduling,
 * including generating review sessions, processing review results,
 * and recalculating due dates.
 */

const { calculateNextInterval, getDueCards, SRS_CONSTANTS } = require('./srs-algorithm');
const CardState = require('../../models/card-state.model');
const Card = require('../../models/card.model');
const Review = require('../../models/review.model');
const mongoose = require('mongoose');
const logger = require('../../utils/logging/logger').logger;

/**
 * Get cards due for review for a specific user and deck
 *
 * @param {string} userId - User ID
 * @param {string} deckId - Deck ID (optional, if not provided gets due cards across all decks)
 * @param {Object} options - Additional options like limit, new cards inclusion, etc.
 * @returns {Promise<Array>} - Array of card objects ready for review
 */
async function getDueCardsForUser(userId, deckId = null, options = {}) {
  try {
    // Set default options
    const defaultOptions = {
      limit: 20,
      includeNew: true,
      newCardLimit: 5,
      includeDetails: true
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Build query to get user's card states
    const query = { userId };
    if (deckId) {
      query.deckId = deckId;
    }
    
    // Get all card states for the user/deck
    const cardStates = await CardState.find(query).lean();
    
    // Use the algorithm to determine which cards are due
    const dueCardIds = getDueCards(cardStates, new Date(), mergedOptions);
    
    // If no cards are due, return empty array
    if (dueCardIds.length === 0) {
      return [];
    }
    
    // If details are requested, fetch the full card data
    if (mergedOptions.includeDetails) {
      const cards = await Card.find({
        _id: { $in: dueCardIds }
      }).lean();
      
      // Merge card content with state information
      const mergedCards = cards.map(card => {
        const state = cardStates.find(cs => cs.cardId.toString() === card._id.toString());
        return {
          ...card,
          state: state.state,
          interval: state.interval,
          due: state.due,
          factor: state.factor,
          streak: state.streak,
          lapses: state.lapses
        };
      });
      
      // Sort cards in the same order as dueCardIds
      return dueCardIds.map(id => 
        mergedCards.find(card => card._id.toString() === id.toString())
      ).filter(Boolean); // Filter out any potential nulls
    }
    
    // If details not requested, just return the IDs
    return dueCardIds;
  } catch (error) {
    logger.error('Error getting due cards:', error);
    throw error;
  }
}

/**
 * Process a review result and update card scheduling
 *
 * @param {string} userId - User ID
 * @param {string} cardId - Card ID
 * @param {Object} reviewData - Review data including performance metrics
 * @returns {Promise<Object>} - Updated card state
 */
async function processReviewResult(userId, cardId, reviewData) {
  try {
    // Create session if not provided
    const sessionId = reviewData.sessionId || null;
    
    // Get the current card state
    let cardState = await CardState.findOne({ userId, cardId });
    
    // If no card state exists, create a new one (first review)
    if (!cardState) {
      // Get card to check deck ID
      const card = await Card.findById(cardId);
      if (!card) {
        throw new Error(`Card ${cardId} not found`);
      }
      
      // Create initial card state
      cardState = new CardState({
        userId,
        cardId,
        deckId: card.deckId,
        state: 'new',
        factor: SRS_CONSTANTS.DEFAULT_EASE_FACTOR,
        interval: 0,
        due: new Date(),
        lapses: 0,
        reviews: 0,
        streak: 0,
        lastReview: null
      });
    }
    
    // Get user context for algorithm calculations
    const userContext = await getUserContext(userId, cardId);
    
    // Calculate next interval using the SRS algorithm
    const updatedState = calculateNextInterval(
      cardState.toObject(),
      reviewData.performance,
      userContext
    );
    
    // Update the card state in the database
    Object.assign(cardState, updatedState);
    await cardState.save();
    
    // Record the review in the history
    const review = new Review({
      userId,
      cardId,
      deckId: cardState.deckId,
      sessionId,
      timestamp: new Date(),
      performance: {
        isCorrect: reviewData.performance.isCorrect,
        responseTime: reviewData.performance.responseTime,
        confidence: reviewData.performance.confidence,
        easeFactor: updatedState.factor,
        prevInterval: reviewData.prevInterval || 0,
        newInterval: updatedState.interval
      },
      context: {
        deviceType: reviewData.context?.deviceType || 'unknown',
        timeOfDay: new Date().getHours(),
        reviewType: reviewData.context?.reviewType || 'scheduled',
        location: reviewData.context?.location
      }
    });
    
    await review.save();
    
    // Update session if provided
    if (sessionId) {
      await updateSession(sessionId, {
        cardId,
        isCorrect: reviewData.performance.isCorrect
      });
    }
    
    // Return the updated card state
    return updatedState;
  } catch (error) {
    logger.error(`Error processing review for card ${cardId}:`, error);
    throw error;
  }
}

/**
 * Get user context data for algorithm calculations
 *
 * @param {string} userId - User ID
 * @param {string} cardId - Current card ID
 * @returns {Promise<Object>} - Context data for SRS calculations
 */
async function getUserContext(userId, cardId) {
  try {
    // Calculate average response time from recent reviews
    const recentReviews = await Review.find({ 
      userId, 
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).sort({ timestamp: -1 }).limit(50).lean();
    
    let avgResponseTime = 0;
    
    if (recentReviews.length > 0) {
      // Calculate average response time
      const totalResponseTime = recentReviews.reduce((sum, review) => {
        return sum + (review.performance.responseTime || 0);
      }, 0);
      
      avgResponseTime = totalResponseTime / recentReviews.length;
    }
    
    // Get time of day performance data
    // This would be more complex in a production environment with ML analysis
    // Here we're using a simple placeholder
    const hourOfDay = new Date().getHours();
    
    return {
      avgResponseTime,
      timeOfDay: hourOfDay,
      deviceType: 'unknown' // Could be extracted from user agent in a real implementation
    };
  } catch (error) {
    logger.error('Error getting user context:', error);
    // Return safe defaults in case of error
    return {
      avgResponseTime: 0,
      timeOfDay: new Date().getHours(),
      deviceType: 'unknown'
    };
  }
}

/**
 * Reset a card's learning progress, moving it back to 'new' state
 *
 * @param {string} userId - User ID
 * @param {string} cardId - Card ID
 * @returns {Promise<Object>} - Updated card state
 */
async function resetCardProgress(userId, cardId) {
  try {
    const cardState = await CardState.findOne({ userId, cardId });
    
    if (!cardState) {
      // If there's no state yet, there's nothing to reset
      return null;
    }
    
    // Reset to initial state
    cardState.state = 'new';
    cardState.factor = SRS_CONSTANTS.DEFAULT_EASE_FACTOR;
    cardState.interval = 0;
    cardState.due = new Date();
    cardState.lapses = 0;
    cardState.streak = 0;
    // Don't reset reviews count to maintain history
    
    await cardState.save();
    return cardState.toObject();
  } catch (error) {
    logger.error(`Error resetting card ${cardId}:`, error);
    throw error;
  }
}

/**
 * Get user's study statistics across all or specific decks
 *
 * @param {string} userId - User ID
 * @param {string} deckId - Optional deck ID to filter stats
 * @returns {Promise<Object>} - Study statistics
 */
async function getUserStatistics(userId, deckId = null) {
  try {
    // Build query
    const query = { userId };
    if (deckId) {
      query.deckId = deckId;
    }
    
    // Get all card states for the user/deck
    const cardStates = await CardState.find(query).lean();
    
    // Get review history
    const reviews = await Review.find(query)
      .sort({ timestamp: -1 })
      .lean();
    
    // Calculate basic statistics
    const stats = {
      totalCards: cardStates.length,
      cardsByState: {
        new: cardStates.filter(c => c.state === 'new').length,
        learning: cardStates.filter(c => c.state === 'learning').length,
        review: cardStates.filter(c => c.state === 'review').length,
        relearning: cardStates.filter(c => c.state === 'relearning').length,
        mastered: cardStates.filter(c => c.state === 'mastered').length,
        suspended: cardStates.filter(c => c.state === 'suspended').length
      },
      reviewStats: {
        totalReviews: reviews.length,
        correctReviews: reviews.filter(r => r.performance.isCorrect).length,
        averageResponseTime: 0,
        reviewsLast7Days: reviews.filter(r => 
          r.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        reviewsLast30Days: reviews.filter(r => 
          r.timestamp >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length
      },
      streakStats: {
        currentStreak: calculateCurrentStreak(reviews),
        longestStreak: calculateLongestStreak(reviews)
      }
    };
    
    // Calculate average response time if there are reviews
    if (reviews.length > 0) {
      const totalResponseTime = reviews.reduce((sum, review) => {
        return sum + (review.performance.responseTime || 0);
      }, 0);
      
      stats.reviewStats.averageResponseTime = totalResponseTime / reviews.length;
    }
    
    // Calculate retention rate
    if (reviews.length > 0) {
      stats.reviewStats.retentionRate = 
        stats.reviewStats.correctReviews / stats.reviewStats.totalReviews;
    } else {
      stats.reviewStats.retentionRate = 0;
    }
    
    return stats;
  } catch (error) {
    logger.error('Error getting user statistics:', error);
    throw error;
  }
}

/**
 * Calculate current study streak from review history
 */
function calculateCurrentStreak(reviews) {
  if (reviews.length === 0) return 0;
  
  // Get unique days with reviews
  const days = new Set();
  reviews.forEach(review => {
    const date = new Date(review.timestamp);
    const dateString = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    days.add(dateString);
  });
  
  // Get the most recent review date
  const latestReview = new Date(reviews[0].timestamp);
  const latestDateString = `${latestReview.getFullYear()}-${latestReview.getMonth()}-${latestReview.getDate()}`;
  
  // Check if there was a review today
  const today = new Date();
  const todayString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  
  // If no review today, check if there was one yesterday
  if (latestDateString !== todayString) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;
    
    if (latestDateString !== yesterdayString) {
      // Streak is broken if no review yesterday or today
      return 0;
    }
  }
  
  // Count consecutive days
  let streak = 1; // Start with 1 for the most recent day
  let currentDate = new Date(latestReview);
  
  while (true) {
    // Check previous day
    currentDate.setDate(currentDate.getDate() - 1);
    const dateString = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
    
    if (days.has(dateString)) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Calculate longest study streak from review history
 */
function calculateLongestStreak(reviews) {
  if (reviews.length === 0) return 0;
  
  // Get unique days with reviews
  const days = new Set();
  reviews.forEach(review => {
    const date = new Date(review.timestamp);
    const dateString = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    days.add(dateString);
  });
  
  // Convert to array and sort
  const sortedDays = Array.from(days).map(d => new Date(d)).sort((a, b) => a - b);
  
  let longestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDays.length; i++) {
    const prevDay = sortedDays[i - 1];
    const currDay = sortedDays[i];
    
    // Check if consecutive days
    const diffTime = Math.abs(currDay - prevDay);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      // Streak broken
      currentStreak = 1;
    }
  }
  
  return longestStreak;
}

/**
 * Create a new review session
 *
 * @param {string} userId - User ID
 * @param {Object} options - Session options (deckId, timeLimit, cardLimit)
 * @returns {Promise<Object>} - Created session
 */
async function createSession(userId, options = {}) {
  try {
    const { deckId, timeLimit, cardLimit } = options;
    
    // Create query for getting due cards
    const cardOptions = {
      limit: cardLimit || 100,
      includeNew: true
    };
    
    // Get due cards for the session
    const dueCards = await getDueCardsForUser(userId, deckId, cardOptions);
    
    if (dueCards.length === 0) {
      throw new Error('No cards available for review');
    }
    
    // Create a new session
    const session = new mongoose.models.Session({
      userId,
      deckId: deckId || null,
      startTime: new Date(),
      endTime: null,
      timeLimit: timeLimit || null,
      totalCards: dueCards.length,
      completedCards: 0,
      correctCards: 0,
      cards: dueCards.map(card => ({
        cardId: card._id,
        reviewed: false,
        result: null,
        responseTime: null
      }))
    });
    
    await session.save();
    return session.toObject();
  } catch (error) {
    logger.error('Error creating review session:', error);
    throw error;
  }
}

/**
 * Get a session by ID
 *
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} - Session data
 */
async function getSessionById(sessionId) {
  try {
    const session = await mongoose.models.Session.findById(sessionId).lean();
    
    if (!session) {
      return null;
    }
    
    // Calculate additional statistics
    if (session.completedCards > 0) {
      session.accuracy = session.correctCards / session.completedCards;
    } else {
      session.accuracy = 0;
    }
    
    // Calculate session duration if completed
    if (session.endTime) {
      session.duration = Math.round((session.endTime - session.startTime) / 1000);
    } else {
      session.duration = Math.round((new Date() - session.startTime) / 1000);
      session.inProgress = true;
    }
    
    return session;
  } catch (error) {
    logger.error(`Error getting session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Update session with review result
 *
 * @param {string} sessionId - Session ID
 * @param {Object} reviewData - Review data (cardId, isCorrect)
 * @returns {Promise<Object>} - Updated session
 */
async function updateSession(sessionId, reviewData) {
  try {
    const { cardId, isCorrect } = reviewData;
    
    const session = await mongoose.models.Session.findById(sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    // Find the card in the session
    const cardIndex = session.cards.findIndex(c => c.cardId.toString() === cardId.toString());
    
    if (cardIndex === -1) {
      throw new Error(`Card ${cardId} not found in session ${sessionId}`);
    }
    
    // Update the card in the session
    session.cards[cardIndex].reviewed = true;
    session.cards[cardIndex].result = isCorrect;
    session.cards[cardIndex].responseTime = reviewData.responseTime || 0;
    
    // Update session statistics
    session.completedCards++;
    if (isCorrect) {
      session.correctCards++;
    }
    
    // Check if session is complete
    if (session.completedCards >= session.totalCards) {
      session.endTime = new Date();
    }
    
    await session.save();
    return session.toObject();
  } catch (error) {
    logger.error(`Error updating session ${sessionId}:`, error);
    throw error;
  }
}

module.exports = {
  getDueCardsForUser,
  processReviewResult,
  resetCardProgress,
  getUserStatistics,
  createSession,
  getSessionById,
  updateSession
};
