/**
 * Session Model
 * 
 * Represents a study session with statistics about card reviews
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionCardSchema = new Schema({
  cardId: {
    type: Schema.Types.ObjectId,
    ref: 'Card',
    required: true
  },
  reviewed: {
    type: Boolean,
    default: false
  },
  result: {
    type: Boolean,
    default: null
  },
  responseTime: {
    type: Number,
    default: null
  }
}, { _id: false });

const sessionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deckId: {
    type: Schema.Types.ObjectId,
    ref: 'Deck',
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  timeLimit: {
    type: Number, // In minutes
    default: null
  },
  totalCards: {
    type: Number,
    required: true
  },
  completedCards: {
    type: Number,
    default: 0
  },
  correctCards: {
    type: Number,
    default: 0
  },
  cards: [sessionCardSchema],
  metadata: {
    deviceType: String,
    browser: String,
    location: String,
    studyMode: {
      type: String,
      enum: ['regular', 'cramming', 'review', 'focused'],
      default: 'regular'
    }
  }
}, {
  timestamps: true
});

// Virtual property for accuracy
sessionSchema.virtual('accuracy').get(function() {
  if (this.completedCards === 0) return 0;
  return this.correctCards / this.completedCards;
});

// Virtual property for completion percentage
sessionSchema.virtual('completionPercentage').get(function() {
  if (this.totalCards === 0) return 0;
  return (this.completedCards / this.totalCards) * 100;
});

// Virtual property for session duration
sessionSchema.virtual('duration').get(function() {
  if (!this.endTime) return null;
  return Math.round((this.endTime - this.startTime) / 1000); // Duration in seconds
});

// Virtual property for session status
sessionSchema.virtual('status').get(function() {
  if (this.endTime) return 'completed';
  
  // Check if session has timed out based on timeLimit
  if (this.timeLimit) {
    const timeoutDate = new Date(this.startTime);
    timeoutDate.setMinutes(timeoutDate.getMinutes() + this.timeLimit);
    
    if (new Date() > timeoutDate) return 'timeout';
  }
  
  return 'active';
});

// Index for efficient querying
sessionSchema.index({ userId: 1, startTime: -1 });
sessionSchema.index({ deckId: 1, startTime: -1 });

// Add toJSON transform method to include virtuals
sessionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

sessionSchema.set('toObject', { virtuals: true });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
