const mongoose = require('mongoose');

/**
 * Card Schema
 * Represents a flashcard with front and back content
 */
const cardSchema = new mongoose.Schema(
  {
    deck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      required: [true, 'Deck reference is required'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Card owner is required'],
    },
    front: {
      type: Object,
      required: [true, 'Front content is required'],
      default: {
        text: '', // Main text content
        media: [], // Array of media URLs (images, audio, etc.)
        formatting: {}, // Formatting options (bold, italic, etc.)
      },
    },
    back: {
      type: Object,
      required: [true, 'Back content is required'],
      default: {
        text: '', // Main text content
        media: [], // Array of media URLs (images, audio, etc.)
        formatting: {}, // Formatting options (bold, italic, etc.)
      },
    },
    type: {
      type: String,
      enum: ['standard', 'cloze', 'image_occlusion', 'multiple_choice', 'true_false'],
      default: 'standard',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    position: {
      type: Number,
      default: 0, // Position in the deck for sorting
    },
    flags: {
      isLeeched: {
        type: Boolean,
        default: false, // Marked as a leech (difficult to remember)
      },
      isMarked: {
        type: Boolean,
        default: false, // Marked for special attention
      },
      isSuspended: {
        type: Boolean,
        default: false, // Temporarily excluded from study
      },
    },
    source: {
      type: {
        type: String,
        enum: ['manual', 'ai_generated', 'imported'],
        default: 'manual',
      },
      reference: String, // Source reference if imported or generated
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 1, // For AI-generated cards, confidence score
      },
    },
    metadata: {
      aiMetadata: {
        modelUsed: String, // Name of AI model that generated the card
        promptUsed: String, // Prompt used to generate the card
        generationDate: Date, // When the card was generated
      },
      importMetadata: {
        importSource: String, // Source of import (Anki, Quizlet, etc.)
        originalId: String, // ID in the original system
        importDate: Date, // When the card was imported
      },
    },
    notes: {
      type: String, // Study notes for the card
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
cardSchema.index({ deck: 1, position: 1 });
cardSchema.index({ owner: 1 });
cardSchema.index({ tags: 1 });
cardSchema.index({ 'flags.isSuspended': 1 });

/**
 * Pre-save hook to update position if not set
 */
cardSchema.pre('save', async function(next) {
  if (this.isNew && this.position === 0) {
    try {
      // Find the highest position in the deck
      const highestPositionCard = await this.constructor.findOne(
        { deck: this.deck },
        { position: 1 },
        { sort: { position: -1 } }
      );
      
      // Set position to one higher than the highest
      this.position = highestPositionCard ? highestPositionCard.position + 1 : 1;
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

/**
 * Post-save hook to update deck statistics
 */
cardSchema.post('save', async function() {
  try {
    // Import the Deck model here to avoid circular dependencies
    const Deck = mongoose.model('Deck');
    
    // Update the deck statistics
    await Deck.updateStatistics(this.deck);
  } catch (error) {
    console.error('Error updating deck statistics:', error);
  }
});

/**
 * Post-remove hook to update deck statistics
 */
cardSchema.post('remove', async function() {
  try {
    // Import the Deck model here to avoid circular dependencies
    const Deck = mongoose.model('Deck');
    
    // Update the deck statistics
    await Deck.updateStatistics(this.deck);
  } catch (error) {
    console.error('Error updating deck statistics:', error);
  }
});

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;
