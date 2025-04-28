const mongoose = require('mongoose');

/**
 * Deck Schema
 * Represents a collection of flashcards
 */
const deckSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Deck title is required'],
      trim: true,
      minlength: [3, 'Deck title must be at least 3 characters long'],
      maxlength: [100, 'Deck title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Deck owner is required'],
    },
    coverImage: {
      type: String,
      default: null,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    category: {
      type: String,
      trim: true,
    },
    visibility: {
      type: String,
      enum: ['private', 'shared', 'public'],
      default: 'private',
    },
    collaborators: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['viewer', 'editor', 'admin'],
        default: 'viewer',
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    statistics: {
      totalCards: {
        type: Number,
        default: 0,
      },
      newCards: {
        type: Number,
        default: 0,
      },
      learningCards: {
        type: Number,
        default: 0,
      },
      reviewCards: {
        type: Number,
        default: 0,
      },
      masteredCards: {
        type: Number,
        default: 0,
      },
      averageDifficulty: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      studyCount: {
        type: Number,
        default: 0, // Number of times the deck has been studied
      },
      lastStudied: {
        type: Date,
        default: null,
      },
    },
    settings: {
      newCardsPerDay: {
        type: Number,
        default: 10,
        min: [1, 'New cards per day must be at least 1'],
        max: [100, 'New cards per day cannot exceed 100'],
      },
      reviewsPerDay: {
        type: Number,
        default: 50,
        min: [1, 'Reviews per day must be at least 1'],
        max: [1000, 'Reviews per day cannot exceed 1000'],
      },
      orderNewCards: {
        type: String,
        enum: ['order_added', 'random'],
        default: 'order_added',
      },
      orderReviews: {
        type: String,
        enum: ['due_date', 'random', 'difficulty'],
        default: 'due_date',
      },
    },
    parentDeck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      default: null, // For forked decks
    },
    isTemplate: {
      type: Boolean,
      default: false, // Whether this is a template deck
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    // For premium/featured decks
    isPremium: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property to get cards in this deck
deckSchema.virtual('cards', {
  ref: 'Card',
  localField: '_id',
  foreignField: 'deck',
});

// Index for efficient queries
deckSchema.index({ owner: 1, title: 1 });
deckSchema.index({ visibility: 1 });
deckSchema.index({ tags: 1 });
deckSchema.index({ 'collaborators.user': 1 });

/**
 * Static method to update deck statistics
 * This should be called when cards are added, removed, or their status changes
 * @param {string} deckId - The deck ID to update
 * @returns {Promise<Deck>} Updated deck
 */
deckSchema.statics.updateStatistics = async function(deckId) {
  const Card = mongoose.model('Card');
  const CardState = mongoose.model('CardState');
  
  // Get all cards in this deck
  const cards = await Card.find({ deck: deckId });
  const totalCards = cards.length;
  
  // Get all card states for this deck's cards
  const states = await CardState.find({
    card: { $in: cards.map(card => card._id) }
  });
  
  // Count cards in each state
  const newCards = cards.length - states.length;
  
  let learningCards = 0;
  let reviewCards = 0;
  let masteredCards = 0;
  
  // Group cards by state
  for (const state of states) {
    if (state.state === 'learning') {
      learningCards++;
    } else if (state.state === 'review') {
      reviewCards++;
    } else if (state.state === 'mastered') {
      masteredCards++;
    }
  }
  
  // Calculate average difficulty if we have any cards
  let averageDifficulty = 0;
  if (states.length > 0) {
    const totalDifficulty = states.reduce((acc, state) => {
      return acc + (5 - state.easeFactor); // Convert ease factor to difficulty (5 - ease)
    }, 0);
    
    averageDifficulty = totalDifficulty / states.length;
  }
  
  // Update the deck statistics
  const updatedDeck = await this.findByIdAndUpdate(
    deckId,
    {
      $set: {
        'statistics.totalCards': totalCards,
        'statistics.newCards': newCards,
        'statistics.learningCards': learningCards,
        'statistics.reviewCards': reviewCards,
        'statistics.masteredCards': masteredCards,
        'statistics.averageDifficulty': averageDifficulty,
      }
    },
    { new: true }
  );
  
  return updatedDeck;
};

const Deck = mongoose.model('Deck', deckSchema);

module.exports = Deck;
