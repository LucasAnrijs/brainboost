const mongoose = require('mongoose');

/**
 * Review Schema
 * Tracks individual card reviews and study sessions
 */
const reviewSchema = new mongoose.Schema(
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
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudySession',
      required: [true, 'Study session reference is required'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    performance: {
      rating: {
        type: String,
        enum: ['again', 'hard', 'good', 'easy'],
        required: [true, 'Performance rating is required'],
      },
      isCorrect: {
        type: Boolean,
        default: function() {
          // 'again' is considered incorrect, all others correct
          return this.performance.rating !== 'again';
        },
      },
      responseTime: {
        type: Number, // In milliseconds
        required: [true, 'Response time is required'],
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: null, // Optional user-reported confidence
      },
    },
    previousState: {
      state: {
        type: String,
        enum: ['new', 'learning', 'review', 'relearning', 'mastered', 'suspended'],
      },
      interval: Number,
      easeFactor: Number,
      due: Date,
    },
    newState: {
      state: {
        type: String,
        enum: ['new', 'learning', 'review', 'relearning', 'mastered', 'suspended'],
      },
      interval: Number,
      easeFactor: Number,
      due: Date,
    },
    deviceInfo: {
      type: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'unknown'],
        default: 'unknown',
      },
      os: String,
      browser: String,
    },
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      placeName: String,
    },
    timeOfDay: {
      hour: {
        type: Number,
        min: 0,
        max: 23,
      },
      timeCategory: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'night'],
      },
    },
    metadata: {
      // Any additional metadata
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
reviewSchema.index({ user: 1, timestamp: -1 });
reviewSchema.index({ user: 1, card: 1, timestamp: -1 });
reviewSchema.index({ session: 1 });
reviewSchema.index({ deck: 1, timestamp: -1 });

/**
 * Pre-save hook to extract time of day info
 */
reviewSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('timestamp')) {
    const reviewTime = new Date(this.timestamp);
    const hour = reviewTime.getHours();
    
    this.timeOfDay = {
      hour,
      timeCategory:
        hour >= 5 && hour < 12
          ? 'morning'
          : hour >= 12 && hour < 17
          ? 'afternoon'
          : hour >= 17 && hour < 22
          ? 'evening'
          : 'night',
    };
  }
  
  next();
});

/**
 * Post-save hook to update user statistics
 */
reviewSchema.post('save', async function() {
  try {
    const User = mongoose.model('User');
    
    // Update user's study statistics
    await User.findByIdAndUpdate(this.user, {
      $inc: {
        'statistics.totalCardsStudied': 1,
      },
    });
    
    // Update user streak
    const user = await User.findById(this.user);
    await user.updateStreak(this.timestamp);
  } catch (error) {
    console.error('Error updating user statistics:', error);
  }
});

/**
 * Static method to get review statistics
 * @param {string} userId - User ID
 * @param {object} options - Options for statistics
 * @param {Date} [options.startDate] - Start date for statistics
 * @param {Date} [options.endDate] - End date for statistics
 * @param {string} [options.deckId] - Optional deck ID filter
 * @returns {Promise<Object>} Review statistics
 */
reviewSchema.statics.getStatistics = async function(userId, options = {}) {
  const { startDate, endDate, deckId } = options;
  
  // Build query
  const query = { user: userId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    
    if (startDate) {
      query.timestamp.$gte = startDate;
    }
    
    if (endDate) {
      query.timestamp.$lte = endDate;
    }
  }
  
  if (deckId) {
    query.deck = deckId;
  }
  
  // Get all reviews matching the query
  const reviews = await this.find(query);
  
  // Calculate statistics
  const totalReviews = reviews.length;
  const correctReviews = reviews.filter(r => r.performance.isCorrect).length;
  const avgResponseTime = reviews.reduce((sum, r) => sum + r.performance.responseTime, 0) / totalReviews || 0;
  
  // Get unique cards reviewed
  const uniqueCards = new Set(reviews.map(r => r.card.toString())).size;
  
  // Group by day to calculate daily stats
  const reviewsByDay = {};
  
  reviews.forEach(review => {
    const day = new Date(review.timestamp).setHours(0, 0, 0, 0);
    
    if (!reviewsByDay[day]) {
      reviewsByDay[day] = {
        date: new Date(day),
        total: 0,
        correct: 0,
        responseTime: 0,
      };
    }
    
    reviewsByDay[day].total += 1;
    
    if (review.performance.isCorrect) {
      reviewsByDay[day].correct += 1;
    }
    
    reviewsByDay[day].responseTime += review.performance.responseTime;
  });
  
  // Calculate averages for each day
  Object.values(reviewsByDay).forEach(day => {
    day.accuracy = day.correct / day.total || 0;
    day.avgResponseTime = day.responseTime / day.total || 0;
    delete day.responseTime; // Remove sum
  });
  
  // Format daily stats as array sorted by date
  const dailyStats = Object.values(reviewsByDay).sort((a, b) => a.date - b.date);
  
  // Return compiled statistics
  return {
    totalReviews,
    uniqueCards,
    accuracy: correctReviews / totalReviews || 0,
    avgResponseTime,
    dailyStats,
  };
};

/**
 * Study Session Schema
 * Tracks a single study session
 */
const studySessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    decks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Deck',
      },
    ],
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // In seconds
      default: 0,
    },
    cardsReviewed: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    hardCount: {
      type: Number,
      default: 0,
    },
    newCount: {
      type: Number,
      default: 0, // Number of new cards introduced
    },
    learningCount: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    sessionMode: {
      type: String,
      enum: ['standard', 'cramming', 'custom', 'scheduled'],
      default: 'standard',
    },
    settings: {
      // Custom settings for this session
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    deviceInfo: {
      type: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'unknown'],
        default: 'unknown',
      },
      os: String,
      browser: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for study sessions
studySessionSchema.index({ user: 1, startTime: -1 });
studySessionSchema.index({ isActive: 1 });

/**
 * Method to end the study session
 * @returns {Promise<StudySession>} Updated session
 */
studySessionSchema.methods.endSession = async function() {
  // Set end time if not already set
  if (!this.endTime) {
    this.endTime = new Date();
    
    // Calculate duration
    const durationMs = this.endTime - this.startTime;
    this.duration = Math.round(durationMs / 1000);
  }
  
  this.isActive = false;
  
  // Update user's total study time
  const studyTimeMinutes = Math.round(this.duration / 60);
  
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.user, {
    $inc: {
      'statistics.totalStudyTime': studyTimeMinutes,
    },
  });
  
  // Update deck last studied info
  if (this.decks.length > 0) {
    const Deck = mongoose.model('Deck');
    
    for (const deckId of this.decks) {
      await Deck.findByIdAndUpdate(deckId, {
        $set: {
          'statistics.lastStudied': this.endTime,
        },
        $inc: {
          'statistics.studyCount': 1,
        },
      });
    }
  }
  
  return this.save();
};

/**
 * Static method to find active session for user
 * @param {string} userId - User ID
 * @returns {Promise<StudySession|null>} Active session or null
 */
studySessionSchema.statics.findActiveSession = async function(userId) {
  return this.findOne({
    user: userId,
    isActive: true,
  });
};

/**
 * Static method to get session statistics
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Session statistics
 */
studySessionSchema.statics.getSessionStats = async function(sessionId) {
  const Review = mongoose.model('Review');
  
  // Get session
  const session = await this.findById(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Get all reviews for this session
  const reviews = await Review.find({ session: sessionId });
  
  // Calculate detailed statistics
  const cardPerformance = {};
  let totalResponseTime = 0;
  let averageResponseTime = 0;
  
  // Process each review
  reviews.forEach(review => {
    const cardId = review.card.toString();
    
    // Track card-specific performance
    if (!cardPerformance[cardId]) {
      cardPerformance[cardId] = {
        card: cardId,
        reviews: 0,
        correct: 0,
        average_response_time: 0,
        total_response_time: 0,
      };
    }
    
    cardPerformance[cardId].reviews += 1;
    
    if (review.performance.isCorrect) {
      cardPerformance[cardId].correct += 1;
    }
    
    cardPerformance[cardId].total_response_time += review.performance.responseTime;
    totalResponseTime += review.performance.responseTime;
  });
  
  // Calculate averages
  for (const cardId in cardPerformance) {
    const card = cardPerformance[cardId];
    card.accuracy = card.correct / card.reviews || 0;
    card.average_response_time = card.total_response_time / card.reviews || 0;
    delete card.total_response_time; // Remove sum
  }
  
  // Overall averages
  averageResponseTime = totalResponseTime / reviews.length || 0;
  
  return {
    session: {
      id: session._id,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      cardsReviewed: session.cardsReviewed,
      accuracy: session.correctCount / session.cardsReviewed || 0,
    },
    cardPerformance: Object.values(cardPerformance),
    overall: {
      averageResponseTime,
      totalCards: Object.keys(cardPerformance).length,
    },
  };
};

// Create models
const Review = mongoose.model('Review', reviewSchema);
const StudySession = mongoose.model('StudySession', studySessionSchema);

module.exports = {
  Review,
  StudySession,
};
