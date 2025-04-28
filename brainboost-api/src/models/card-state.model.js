const mongoose = require('mongoose');

/**
 * Card State Schema
 * Tracks the learning state of a card for a specific user
 * Implements the spaced repetition algorithm state
 */
const cardStateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      required: [true, 'Card reference is required'],
    },
    deck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      required: [true, 'Deck reference is required'],
    },
    state: {
      type: String,
      enum: ['new', 'learning', 'review', 'relearning', 'mastered', 'suspended'],
      default: 'new',
      required: [true, 'Learning state is required'],
    },
    easeFactor: {
      type: Number,
      default: 2.5, // Initial ease factor (SM-2 algorithm)
      min: [1.3, 'Ease factor cannot be less than 1.3'],
      max: [3.0, 'Ease factor cannot exceed 3.0'],
    },
    interval: {
      type: Number,
      default: 0, // Interval in days
      min: [0, 'Interval cannot be negative'],
    },
    due: {
      type: Date,
      default: Date.now, // Due date for next review
    },
    lapses: {
      type: Number,
      default: 0, // Number of times the card was forgotten
    },
    streak: {
      type: Number,
      default: 0, // Consecutive correct reviews
    },
    reviews: {
      type: Number,
      default: 0, // Total number of reviews
    },
    averageTime: {
      type: Number,
      default: 0, // Average response time in milliseconds
    },
    lastReview: {
      type: Date,
      default: null, // Date of last review
    },
    history: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        state: {
          type: String,
          enum: ['new', 'learning', 'review', 'relearning', 'mastered', 'suspended'],
        },
        performance: {
          type: String,
          enum: ['again', 'hard', 'good', 'easy'],
        },
        interval: Number, // Interval after this review
        easeFactor: Number, // Ease factor after this review
        timeTaken: Number, // Response time in milliseconds
      },
    ],
    // Learning step progress (for cards in learning/relearning state)
    step: {
      type: Number,
      default: 0, // Current step in the learning process
    },
    postponed: {
      type: Boolean,
      default: false, // Whether review has been postponed
    },
    postponedUntil: {
      type: Date,
      default: null, // When to resume review if postponed
    },
    extraData: {
      // Additional algorithm-specific data
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
cardStateSchema.index({ user: 1, card: 1 }, { unique: true });
cardStateSchema.index({ user: 1, deck: 1, due: 1 });
cardStateSchema.index({ user: 1, state: 1 });

/**
 * Static method to update card state based on review result
 * @param {string} userId - User ID
 * @param {string} cardId - Card ID
 * @param {string} performance - Performance rating ('again', 'hard', 'good', 'easy')
 * @param {number} responseTime - Time taken to respond in milliseconds
 * @returns {Promise<CardState>} Updated card state
 */
cardStateSchema.statics.updateCardState = async function(
  userId,
  cardId,
  performance,
  responseTime
) {
  // Find the card state
  let cardState = await this.findOne({ user: userId, card: cardId });
  
  // If card state doesn't exist, create one
  if (!cardState) {
    const Card = mongoose.model('Card');
    const card = await Card.findById(cardId);
    
    if (!card) {
      throw new Error('Card not found');
    }
    
    cardState = new this({
      user: userId,
      card: cardId,
      deck: card.deck,
      state: 'new',
      due: Date.now(),
    });
  }
  
  // Record the review
  const now = new Date();
  cardState.reviews += 1;
  cardState.lastReview = now;
  
  // Update average response time
  if (responseTime) {
    if (cardState.reviews === 1) {
      cardState.averageTime = responseTime;
    } else {
      // Weighted average with more weight to recent times
      cardState.averageTime = 0.7 * responseTime + 0.3 * cardState.averageTime;
    }
  }
  
  // Calculate new state, interval, and ease factor based on performance
  let newEaseFactor = cardState.easeFactor;
  let newInterval = cardState.interval;
  let newState = cardState.state;
  let newStep = cardState.step;
  
  // Handle performance based on current state
  switch (cardState.state) {
    case 'new':
    case 'learning':
      if (performance === 'again') {
        // Failed response in learning - reset step
        newState = 'learning';
        newStep = 0;
        newInterval = 0.1; // 1/10 of a day (about 2.4 hours)
      } else if (performance === 'good' || performance === 'easy') {
        // Successful response in learning
        newStep += 1;
        
        if (newStep >= 2 || performance === 'easy') {
          // Graduated from learning to review
          newState = 'review';
          newInterval = performance === 'easy' ? 3 : 1; // 1 day or 3 days if easy
        } else {
          // Still in learning
          newState = 'learning';
          newInterval = 0.4; // About 10 hours
        }
      } else {
        // 'hard' response - stay in learning but increase interval slightly
        newState = 'learning';
        newInterval = 0.2; // About 5 hours
      }
      break;
      
    case 'review':
      if (performance === 'again') {
        // Failed review - move to relearning
        newState = 'relearning';
        newStep = 0;
        newInterval = 0.1; // 1/10 of a day
        newEaseFactor = Math.max(1.3, cardState.easeFactor - 0.2); // Decrease ease factor
        cardState.lapses += 1;
        cardState.streak = 0;
      } else {
        // Successful review - calculate new interval based on performance
        let intervalMultiplier;
        
        if (performance === 'hard') {
          intervalMultiplier = 1.2;
          newEaseFactor = Math.max(1.3, cardState.easeFactor - 0.15);
        } else if (performance === 'good') {
          intervalMultiplier = cardState.easeFactor;
        } else {
          // 'easy'
          intervalMultiplier = cardState.easeFactor * 1.3;
          newEaseFactor = Math.min(3.0, cardState.easeFactor + 0.15);
        }
        
        // Calculate new interval, ensuring it's at least 1 day
        newInterval = Math.max(1, Math.round(cardState.interval * intervalMultiplier));
        
        // Cap interval at 365 days
        newInterval = Math.min(365, newInterval);
        
        // Increment streak for successful reviews
        cardState.streak += 1;
        
        // Check if card should be moved to mastered state
        if (newInterval >= 21 && cardState.streak >= 3) {
          newState = 'mastered';
        } else {
          newState = 'review';
        }
      }
      break;
      
    case 'relearning':
      if (performance === 'again') {
        // Failed in relearning - reset step
        newState = 'relearning';
        newStep = 0;
        newInterval = 0.1; // 1/10 of a day
      } else if (performance === 'good' || performance === 'easy') {
        // Successful in relearning
        newStep += 1;
        
        if (newStep >= 1 || performance === 'easy') {
          // Graduate back to review
          newState = 'review';
          newInterval = performance === 'easy' ? 2 : 1;
        } else {
          // Stay in relearning
          newState = 'relearning';
          newInterval = 0.4; // About 10 hours
        }
      } else {
        // 'hard' in relearning
        newState = 'relearning';
        newInterval = 0.2; // About 5 hours
      }
      break;
      
    case 'mastered':
      if (performance === 'again') {
        // Failed mastered card - move to relearning
        newState = 'relearning';
        newStep = 0;
        newInterval = 0.1;
        newEaseFactor = Math.max(1.3, cardState.easeFactor - 0.2);
        cardState.lapses += 1;
        cardState.streak = 0;
      } else {
        // Successful review of mastered card
        let intervalMultiplier;
        
        if (performance === 'hard') {
          intervalMultiplier = 1.2;
          newEaseFactor = Math.max(1.3, cardState.easeFactor - 0.15);
        } else if (performance === 'good') {
          intervalMultiplier = cardState.easeFactor;
        } else {
          // 'easy'
          intervalMultiplier = cardState.easeFactor * 1.3;
          newEaseFactor = Math.min(3.0, cardState.easeFactor + 0.15);
        }
        
        // Calculate new interval
        newInterval = Math.max(1, Math.round(cardState.interval * intervalMultiplier));
        
        // Cap interval at 365 days
        newInterval = Math.min(365, newInterval);
        
        // Stay in mastered state
        newState = 'mastered';
        
        // Increment streak
        cardState.streak += 1;
      }
      break;
      
    case 'suspended':
      // Don't change anything for suspended cards
      return cardState;
  }
  
  // Calculate new due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + newInterval);
  
  // Update card state
  cardState.state = newState;
  cardState.interval = newInterval;
  cardState.easeFactor = newEaseFactor;
  cardState.due = dueDate;
  cardState.step = newStep;
  
  // Add to history
  cardState.history.push({
    date: now,
    state: newState,
    performance,
    interval: newInterval,
    easeFactor: newEaseFactor,
    timeTaken: responseTime || 0,
  });
  
  // Keep history limited to the last 100 entries
  if (cardState.history.length > 100) {
    cardState.history = cardState.history.slice(-100);
  }
  
  // Save and return updated card state
  return cardState.save();
};

/**
 * Static method to get due cards for a user
 * @param {string} userId - User ID
 * @param {object} options - Options for retrieving due cards
 * @param {string} [options.deckId] - Optional deck ID filter
 * @param {number} [options.limit=20] - Maximum number of cards to return
 * @param {number} [options.newCardLimit] - Limit on new cards
 * @returns {Promise<Array>} Array of due cards with their states
 */
cardStateSchema.statics.getDueCards = async function(userId, options = {}) {
  const { deckId, limit = 20, newCardLimit = 10 } = options;
  const now = new Date();
  
  // Base query for finding cards that are due
  const baseQuery = {
    user: userId,
    state: { $ne: 'suspended' },
    due: { $lte: now },
  };
  
  // Add deck filter if provided
  if (deckId) {
    baseQuery.deck = deckId;
  }
  
  // Get card states for cards in learning, relearning, and review
  const dueCardStates = await this.find({
    ...baseQuery,
    state: { $in: ['learning', 'relearning', 'review', 'mastered'] },
  })
    .sort({ due: 1 }) // Oldest due first
    .limit(limit)
    .populate({
      path: 'card',
      select: '-metadata', // Exclude large metadata
      match: { 'flags.isSuspended': false }, // Filter out suspended cards
    });
  
  // Filter out any card states where the card reference is missing
  const validDueCardStates = dueCardStates.filter(state => state.card);
  
  // If we have enough due reviews, return them
  if (validDueCardStates.length >= limit) {
    return validDueCardStates;
  }
  
  // Otherwise, get some new cards as well
  const cardsNeeded = limit - validDueCardStates.length;
  const newCardsToFetch = Math.min(cardsNeeded, newCardLimit);
  
  if (newCardsToFetch > 0) {
    // Find cards in the deck that the user has not studied yet
    const Card = mongoose.model('Card');
    
    // Get already studied card IDs
    const studiedCardIds = await this.distinct('card', { user: userId });
    
    // Filter query for new cards
    const newCardsQuery = {
      'flags.isSuspended': false,
    };
    
    // Add deck filter if provided
    if (deckId) {
      newCardsQuery.deck = deckId;
    }
    
    // Exclude already studied cards
    if (studiedCardIds.length > 0) {
      newCardsQuery._id = { $nin: studiedCardIds };
    }
    
    // Get new cards
    const newCards = await Card.find(newCardsQuery)
      .sort({ position: 1 }) // Get cards in deck order
      .limit(newCardsToFetch);
    
    // Create card states for new cards
    const newCardStates = [];
    
    for (const card of newCards) {
      const cardState = new this({
        user: userId,
        card: card._id,
        deck: card.deck,
        state: 'new',
        due: now,
      });
      
      // Attach the card document directly
      cardState.card = card;
      
      newCardStates.push(cardState);
    }
    
    // Combine due and new cards
    return [...validDueCardStates, ...newCardStates];
  }
  
  // Return just the due cards if no new cards are needed
  return validDueCardStates;
};

const CardState = mongoose.model('CardState', cardStateSchema);

module.exports = CardState;
