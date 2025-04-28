/**
 * SRS Algorithm Implementation for BrainBoost
 * Based on the SM-2 algorithm with custom modifications for:
 * - Response time factoring
 * - Time of day optimization
 * - Streak bonuses
 * - Performance-based adjustments
 */

const logger = require('../../utils/logging/logger').logger;

// Constants for the SRS algorithm
const SRS_CONSTANTS = {
  // Minimum ease factor to prevent cards from becoming too difficult
  MIN_EASE_FACTOR: 1.3,
  
  // Default starting ease factor for new cards
  DEFAULT_EASE_FACTOR: 2.5,
  
  // Maximum ease factor to prevent intervals from growing too quickly
  MAX_EASE_FACTOR: 2.5,
  
  // Initial intervals for new cards (in days)
  INITIAL_INTERVALS: [1, 3, 7],
  
  // Minimum interval for cards in days (prevents intervals from becoming too short)
  MIN_INTERVAL: 1,
  
  // Maximum interval in days (prevents intervals from becoming too long)
  MAX_INTERVAL: 365,
  
  // Percentage to reduce interval by when a card is answered incorrectly
  LAPSE_PERCENTAGE: 0.2,
  
  // Amount to decrease ease factor by when a card is answered incorrectly
  EASE_FACTOR_DECREASE: 0.2,
  
  // Base modifier for interval calculations
  BASE_MODIFIER: 1.0,
  
  // Streak factor increment per consecutive correct answer (up to 10)
  STREAK_FACTOR_INCREMENT: 0.01
};

/**
 * Calculate the next interval for a card based on user performance
 * 
 * @param {Object} card - Card learning state object
 * @param {Object} performance - Performance metrics from the review
 * @param {Object} userContext - Context information about the user and session
 * @returns {Object} Updated card state with new interval, ease factor, etc.
 */
function calculateNextInterval(card, performance, userContext) {
  try {
    // Clone the card state to avoid direct mutation
    const updatedCard = { ...card };
    
    // Extract performance metrics
    const { isCorrect, responseTime, confidence } = performance;
    
    // Extract relevant user context
    const { avgResponseTime, timeOfDay, deviceType } = userContext;
    
    // Handle correct answer
    if (isCorrect) {
      return handleCorrectAnswer(updatedCard, performance, userContext);
    } 
    // Handle incorrect answer
    else {
      return handleIncorrectAnswer(updatedCard, performance, userContext);
    }
  } catch (error) {
    logger.error('Error calculating next interval:', error);
    // Fall back to a safe default if something goes wrong
    return fallbackIntervalCalculation(card);
  }
}

/**
 * Handle calculation for a correct answer
 */
function handleCorrectAnswer(card, performance, userContext) {
  let nextInterval;
  let newEaseFactor = card.factor;
  
  // Calculate quality score (0-5) based on response time and self-reported confidence
  const qualityScore = calculateQualityScore(performance, userContext);
  
  // Adjust ease factor based on quality score
  newEaseFactor = adjustEaseFactor(card.factor, qualityScore);
  
  // Calculate next interval based on card state
  if (card.state === 'new' || card.state === 'learning') {
    // If this is a new card or still in learning phase, use fixed progression
    const progressIndex = Math.min(card.reviews || 0, SRS_CONSTANTS.INITIAL_INTERVALS.length - 1);
    nextInterval = SRS_CONSTANTS.INITIAL_INTERVALS[progressIndex];
    
    // If we've gone through all initial intervals, move to review state
    if (progressIndex >= SRS_CONSTANTS.INITIAL_INTERVALS.length - 1) {
      card.state = 'review';
    } else {
      card.state = 'learning';
    }
  } 
  else if (card.state === 'relearning') {
    // For relearning cards, move back to review state with a conservative interval
    nextInterval = Math.max(
      SRS_CONSTANTS.MIN_INTERVAL,
      Math.round(card.interval * 0.5)
    );
    card.state = 'review';
  }
  else {
    // For review cards, calculate interval using ease factor and modifiers
    const modifier = calculatePerformanceModifier(performance, userContext, card);
    
    // SM-2 formula: I(n) = I(n-1) * EF * M
    nextInterval = Math.round(card.interval * newEaseFactor * modifier);
    
    // Apply boundaries
    nextInterval = Math.max(SRS_CONSTANTS.MIN_INTERVAL, nextInterval);
    nextInterval = Math.min(SRS_CONSTANTS.MAX_INTERVAL, nextInterval);
    
    // Check if card should be moved to mastered state
    if (card.streak >= 4 && card.interval >= 21) {
      card.state = 'mastered';
    } else {
      card.state = 'review';
    }
  }
  
  // Update card state
  card.factor = newEaseFactor;
  card.interval = nextInterval;
  card.streak = (card.streak || 0) + 1;
  card.due = calculateDueDate(nextInterval);
  card.reviews = (card.reviews || 0) + 1;
  card.lastReview = new Date();
  
  return card;
}

/**
 * Handle calculation for an incorrect answer
 */
function handleIncorrectAnswer(card, performance, userContext) {
  // Reset streak
  card.streak = 0;
  
  // Increment lapses counter
  card.lapses = (card.lapses || 0) + 1;
  
  // Adjust ease factor (make card more difficult)
  card.factor = Math.max(
    SRS_CONSTANTS.MIN_EASE_FACTOR,
    card.factor - SRS_CONSTANTS.EASE_FACTOR_DECREASE
  );
  
  // Calculate new interval based on current state
  if (card.state === 'review' || card.state === 'mastered') {
    // Move to relearning state
    card.state = 'relearning';
    
    // Calculate new reduced interval
    card.interval = Math.max(
      SRS_CONSTANTS.MIN_INTERVAL,
      Math.round(card.interval * SRS_CONSTANTS.LAPSE_PERCENTAGE)
    );
  } 
  else if (card.state === 'learning' || card.state === 'relearning') {
    // Stay in current state but reset progress
    card.interval = SRS_CONSTANTS.MIN_INTERVAL;
  }
  else {
    // For new cards that were answered incorrectly
    card.state = 'learning';
    card.interval = SRS_CONSTANTS.MIN_INTERVAL;
  }
  
  // Update due date
  card.due = calculateDueDate(card.interval);
  
  // Increment reviews counter
  card.reviews = (card.reviews || 0) + 1;
  card.lastReview = new Date();
  
  return card;
}

/**
 * Calculate quality score (0-5) based on response time and confidence
 */
function calculateQualityScore(performance, userContext) {
  const { responseTime, confidence } = performance;
  const { avgResponseTime } = userContext;
  
  // Base score from self-reported confidence (0-1 scale)
  let score = confidence ? confidence * 5 : 2.5;
  
  // Adjust based on response time relative to average
  if (avgResponseTime && responseTime) {
    const responseTimeRatio = responseTime / avgResponseTime;
    
    if (responseTimeRatio < 0.5) {
      // Very quick response, likely well-known
      score += 0.5;
    } else if (responseTimeRatio > 2.0) {
      // Very slow response, likely struggling
      score -= 0.5;
    }
  }
  
  // Ensure score is within 0-5 range
  return Math.max(0, Math.min(5, score));
}

/**
 * Adjust ease factor based on quality score
 */
function adjustEaseFactor(currentFactor, qualityScore) {
  // SM-2 formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newFactor = currentFactor + (0.1 - (5 - qualityScore) * (0.08 + (5 - qualityScore) * 0.02));
  
  // Ensure ease factor stays within acceptable bounds
  return Math.max(SRS_CONSTANTS.MIN_EASE_FACTOR, 
         Math.min(SRS_CONSTANTS.MAX_EASE_FACTOR, newFactor));
}

/**
 * Calculate performance modifier based on various factors
 */
function calculatePerformanceModifier(performance, userContext, card) {
  const { responseTime } = performance;
  const { avgResponseTime, timeOfDay, deviceType } = userContext;
  
  let modifier = SRS_CONSTANTS.BASE_MODIFIER;
  
  // Response time factor
  if (avgResponseTime && responseTime) {
    if (responseTime < avgResponseTime * 0.5) {
      modifier *= 1.2; // Much faster than average
    } else if (responseTime > avgResponseTime * 2.0) {
      modifier *= 0.8; // Much slower than average
    }
  }
  
  // Time of day factor (if historical data shows user performs better/worse at certain times)
  if (timeOfDay !== undefined) {
    // This would be based on user's historical performance at different times
    // For now using a placeholder implementation
    const timeOfDayFactor = 1.0; // Default neutral value
    modifier *= timeOfDayFactor;
  }
  
  // Streak factor (small bonus for consistent correct answers)
  const streak = card.streak || 0;
  const streakFactor = 1.0 + (Math.min(streak, 10) * SRS_CONSTANTS.STREAK_FACTOR_INCREMENT);
  modifier *= streakFactor;
  
  return modifier;
}

/**
 * Calculate due date from interval
 */
function calculateDueDate(interval) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);
  return dueDate;
}

/**
 * Fallback calculation in case of errors
 */
function fallbackIntervalCalculation(card) {
  const safeCard = { ...card };
  
  // Ensure the card has at least the basic required properties
  safeCard.interval = safeCard.interval || SRS_CONSTANTS.MIN_INTERVAL;
  safeCard.factor = safeCard.factor || SRS_CONSTANTS.DEFAULT_EASE_FACTOR;
  safeCard.state = safeCard.state || 'learning';
  safeCard.due = safeCard.due || calculateDueDate(safeCard.interval);
  safeCard.reviews = safeCard.reviews || 0;
  safeCard.lapses = safeCard.lapses || 0;
  safeCard.streak = safeCard.streak || 0;
  safeCard.lastReview = safeCard.lastReview || new Date();
  
  return safeCard;
}

/**
 * Get a list of due cards for a user's deck
 * 
 * @param {Array} cardStates - Array of card learning states for the user
 * @param {Date} currentDate - Reference date (usually now)
 * @param {Object} options - Additional options like limit, includeNew, etc.
 * @returns {Array} List of due card IDs ordered by priority
 */
function getDueCards(cardStates, currentDate, options = {}) {
  const { 
    limit = 20, 
    includeNew = true, 
    newCardLimit = 5 
  } = options;
  
  const now = currentDate || new Date();
  
  // Filter cards that are due
  const dueCards = cardStates.filter(card => 
    card.state !== 'suspended' && card.due <= now
  );
  
  // Filter new cards if requested
  const newCards = includeNew ? 
    cardStates.filter(card => card.state === 'new').slice(0, newCardLimit) : 
    [];
  
  // Combine due and new cards
  const allDueCards = [...dueCards, ...newCards];
  
  // Sort cards by priority:
  // 1. Overdue cards (oldest first)
  // 2. Relearning cards (highest priority for reinforcement)
  // 3. Learning cards
  // 4. Review cards
  // 5. New cards (lowest priority)
  allDueCards.sort((a, b) => {
    // First, sort by state priority
    const statePriority = getStatePriority(a.state) - getStatePriority(b.state);
    if (statePriority !== 0) return statePriority;
    
    // For cards with the same state, sort by due date (oldest first)
    return new Date(a.due) - new Date(b.due);
  });
  
  // Limit the number of cards if specified
  return allDueCards.slice(0, limit).map(card => card.cardId);
}

/**
 * Helper function to determine card state priority for sorting
 */
function getStatePriority(state) {
  switch (state) {
    case 'relearning': return 1; // Highest priority
    case 'learning': return 2;
    case 'review': return 3;
    case 'new': return 4; // Lowest priority
    case 'mastered': return 3; // Same as review for due cards
    default: return 5; // Suspended or unknown states
  }
}

module.exports = {
  calculateNextInterval,
  getDueCards,
  SRS_CONSTANTS
};
