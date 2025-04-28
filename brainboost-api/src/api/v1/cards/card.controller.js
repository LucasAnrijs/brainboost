/**
 * Card Controller
 * Handles API requests related to flashcards
 */

const Card = require('../../../models/card.model');
const Deck = require('../../../models/deck.model');
const { AppError, notFound, forbidden } = require('../../../utils/errors/app-error');
const logger = require('../../../utils/logging/logger').logger;

/**
 * Create a new card
 * @route POST /api/v1/cards/:deckId
 */
const createCard = async (req, res, next) => {
  try {
    const { deckId } = req.params;
    const { front, back, type, tags, notes } = req.body;
    
    // Check if deck exists and user has permission
    const deck = await Deck.findById(deckId);
    
    if (!deck) {
      return next(notFound(`Deck with ID ${deckId} not found`));
    }
    
    // Check if user has permission to add cards to this deck
    const isOwner = deck.owner.toString() === req.user.id;
    const isCollaborator = deck.collaborators.some(
      c => c.user.toString() === req.user.id && ['editor', 'admin'].includes(c.role)
    );
    
    if (!isOwner && !isCollaborator) {
      return next(forbidden('You do not have permission to add cards to this deck'));
    }
    
    // Create card object
    const card = new Card({
      deck: deckId,
      owner: req.user.id,
      front: {
        text: front.text || '',
        media: front.media || [],
        formatting: front.formatting || {},
      },
      back: {
        text: back.text || '',
        media: back.media || [],
        formatting: back.formatting || {},
      },
      type: type || 'standard',
      tags: tags || [],
      notes: notes || '',
      lastModifiedBy: req.user.id,
    });
    
    // Save card
    await card.save();
    
    // Increment the deck's card count
    deck.statistics.totalCards += 1;
    deck.statistics.newCards += 1;
    await deck.save();
    
    return res.success(card, 'Card created successfully');
  } catch (error) {
    logger.error('Error creating card:', error);
    return next(error);
  }
};

/**
 * Get all cards in a deck
 * @route GET /api/v1/cards/:deckId
 */
const getCardsByDeck = async (req, res, next) => {
  try {
    const { deckId } = req.params;
    
    // Check if deck exists and user has access
    const deck = await Deck.findById(deckId);
    
    if (!deck) {
      return next(notFound(`Deck with ID ${deckId} not found`));
    }
    
    // Check if user has permission to view this deck
    const isOwner = deck.owner.toString() === req.user.id;
    const isCollaborator = deck.collaborators.some(c => c.user.toString() === req.user.id);
    const isPublic = deck.visibility === 'public';
    
    if (!isOwner && !isCollaborator && !isPublic) {
      return next(forbidden('You do not have permission to view this deck'));
    }
    
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'position';
    const order = req.query.order === 'desc' ? -1 : 1;
    const filter = req.query.filter || '';
    const tags = req.query.tags ? req.query.tags.split(',') : [];
    
    // Build filter query
    const query = { deck: deckId };
    
    // Add text search if filter is provided
    if (filter) {
      query.$or = [
        { 'front.text': { $regex: filter, $options: 'i' } },
        { 'back.text': { $regex: filter, $options: 'i' } },
        { tags: { $in: [filter] } }
      ];
    }
    
    // Add tag filter if tags are provided
    if (tags.length > 0) {
      query.tags = { $all: tags };
    }
    
    // Get cards with pagination
    const sortOption = {};
    sortOption[sort] = order;
    
    const cards = await Card.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const total = await Card.countDocuments(query);
    
    return res.success({
      cards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Cards retrieved successfully');
  } catch (error) {
    logger.error(`Error getting cards for deck ${req.params.deckId}:`, error);
    return next(error);
  }
};

/**
 * Get a card by ID
 * @route GET /api/v1/cards/card/:id
 */
const getCardById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const card = await Card.findById(id);
    
    if (!card) {
      return next(notFound(`Card with ID ${id} not found`));
    }
    
    // Check if user has permission to view this card's deck
    const deck = await Deck.findById(card.deck);
    
    if (!deck) {
      return next(notFound(`Deck for this card not found`));
    }
    
    const isOwner = deck.owner.toString() === req.user.id;
    const isCollaborator = deck.collaborators.some(c => c.user.toString() === req.user.id);
    const isPublic = deck.visibility === 'public';
    
    if (!isOwner && !isCollaborator && !isPublic) {
      return next(forbidden('You do not have permission to view this card'));
    }
    
    return res.success(card, 'Card retrieved successfully');
  } catch (error) {
    logger.error(`Error getting card ${req.params.id}:`, error);
    return next(error);
  }
};

/**
 * Update a card
 * @route PUT /api/v1/cards/:id
 */
const updateCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { front, back, type, tags, notes, flags } = req.body;
    
    const card = await Card.findById(id);
    
    if (!card) {
      return next(notFound(`Card with ID ${id} not found`));
    }
    
    // Check if user has permission to update this card
    const deck = await Deck.findById(card.deck);
    
    if (!deck) {
      return next(notFound(`Deck for this card not found`));
    }
    
    const isOwner = deck.owner.toString() === req.user.id;
    const isCardOwner = card.owner.toString() === req.user.id;
    const isCollaborator = deck.collaborators.some(
      c => c.user.toString() === req.user.id && ['editor', 'admin'].includes(c.role)
    );
    
    if (!isOwner && !isCardOwner && !isCollaborator) {
      return next(forbidden('You do not have permission to update this card'));
    }
    
    // Update card fields
    if (front) {
      card.front = {
        text: front.text || card.front.text,
        media: front.media || card.front.media,
        formatting: front.formatting || card.front.formatting,
      };
    }
    
    if (back) {
      card.back = {
        text: back.text || card.back.text,
        media: back.media || card.back.media,
        formatting: back.formatting || card.back.formatting,
      };
    }
    
    if (type) card.type = type;
    if (tags) card.tags = tags;
    if (notes !== undefined) card.notes = notes;
    
    if (flags) {
      card.flags = {
        ...card.flags,
        ...flags
      };
    }
    
    // Update modification metadata
    card.lastModifiedBy = req.user.id;
    
    // Save updated card
    await card.save();
    
    return res.success(card, 'Card updated successfully');
  } catch (error) {
    logger.error(`Error updating card ${req.params.id}:`, error);
    return next(error);
  }
};

/**
 * Delete a card
 * @route DELETE /api/v1/cards/:id
 */
const deleteCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const card = await Card.findById(id);
    
    if (!card) {
      return next(notFound(`Card with ID ${id} not found`));
    }
    
    // Check if user has permission to delete this card
    const deck = await Deck.findById(card.deck);
    
    if (!deck) {
      return next(notFound(`Deck for this card not found`));
    }
    
    const isOwner = deck.owner.toString() === req.user.id;
    const isCardOwner = card.owner.toString() === req.user.id;
    const isCollaborator = deck.collaborators.some(
      c => c.user.toString() === req.user.id && ['editor', 'admin'].includes(c.role)
    );
    
    if (!isOwner && !isCardOwner && !isCollaborator) {
      return next(forbidden('You do not have permission to delete this card'));
    }
    
    // Delete the card
    await card.deleteOne();
    
    // Update deck statistics
    deck.statistics.totalCards -= 1;
    await deck.save();
    
    return res.success({ id }, 'Card deleted successfully');
  } catch (error) {
    logger.error(`Error deleting card ${req.params.id}:`, error);
    return next(error);
  }
};

/**
 * Create multiple cards at once
 * @route POST /api/v1/cards/:deckId/bulk
 */
const bulkCreateCards = async (req, res, next) => {
  try {
    const { deckId } = req.params;
    const { cards } = req.body;
    
    if (!Array.isArray(cards) || cards.length === 0) {
      return next(new AppError('Cards array is required and cannot be empty', 400));
    }
    
    // Check if deck exists and user has permission
    const deck = await Deck.findById(deckId);
    
    if (!deck) {
      return next(notFound(`Deck with ID ${deckId} not found`));
    }
    
    // Check if user has permission to add cards to this deck
    const isOwner = deck.owner.toString() === req.user.id;
    const isCollaborator = deck.collaborators.some(
      c => c.user.toString() === req.user.id && ['editor', 'admin'].includes(c.role)
    );
    
    if (!isOwner && !isCollaborator) {
      return next(forbidden('You do not have permission to add cards to this deck'));
    }
    
    // Get max position in deck for positioning
    const highestPositionCard = await Card.findOne(
      { deck: deckId },
      { position: 1 },
      { sort: { position: -1 } }
    );
    
    let nextPosition = highestPositionCard ? highestPositionCard.position + 1 : 1;
    
    // Prepare cards for bulk insertion
    const cardsToInsert = cards.map(cardData => {
      const position = nextPosition++;
      
      return {
        deck: deckId,
        owner: req.user.id,
        front: {
          text: cardData.front.text || '',
          media: cardData.front.media || [],
          formatting: cardData.front.formatting || {},
        },
        back: {
          text: cardData.back.text || '',
          media: cardData.back.media || [],
          formatting: cardData.back.formatting || {},
        },
        type: cardData.type || 'standard',
        tags: cardData.tags || [],
        position,
        notes: cardData.notes || '',
        lastModifiedBy: req.user.id,
      };
    });
    
    // Insert cards
    const createdCards = await Card.insertMany(cardsToInsert);
    
    // Update deck statistics
    deck.statistics.totalCards += createdCards.length;
    deck.statistics.newCards += createdCards.length;
    await deck.save();
    
    return res.success(createdCards, `${createdCards.length} cards created successfully`);
  } catch (error) {
    logger.error('Error bulk creating cards:', error);
    return next(error);
  }
};

/**
 * Reorder a card within a deck
 * @route PUT /api/v1/cards/:id/reorder
 */
const reorderCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPosition } = req.body;
    
    if (typeof newPosition !== 'number') {
      return next(new AppError('New position must be a number', 400));
    }
    
    const card = await Card.findById(id);
    
    if (!card) {
      return next(notFound(`Card with ID ${id} not found`));
    }
    
    // Check if user has permission to reorder cards in this deck
    const deck = await Deck.findById(card.deck);
    
    if (!deck) {
      return next(notFound(`Deck for this card not found`));
    }
    
    const isOwner = deck.owner.toString() === req.user.id;
    const isCollaborator = deck.collaborators.some(
      c => c.user.toString() === req.user.id && ['editor', 'admin'].includes(c.role)
    );
    
    if (!isOwner && !isCollaborator) {
      return next(forbidden('You do not have permission to reorder cards in this deck'));
    }
    
    // Get the current position
    const currentPosition = card.position;
    
    // If the positions are the same, no need to reorder
    if (currentPosition === newPosition) {
      return res.success(card, 'Card position unchanged');
    }
    
    // Update positions of all affected cards
    if (newPosition < currentPosition) {
      // Moving card up - increment positions of cards in between
      await Card.updateMany(
        { 
          deck: card.deck, 
          position: { $gte: newPosition, $lt: currentPosition }
        },
        { $inc: { position: 1 } }
      );
    } else {
      // Moving card down - decrement positions of cards in between
      await Card.updateMany(
        { 
          deck: card.deck, 
          position: { $gt: currentPosition, $lte: newPosition }
        },
        { $inc: { position: -1 } }
      );
    }
    
    // Update this card's position
    card.position = newPosition;
    await card.save();
    
    return res.success(card, 'Card reordered successfully');
  } catch (error) {
    logger.error(`Error reordering card ${req.params.id}:`, error);
    return next(error);
  }
};

/**
 * Toggle card flags (suspended, marked, etc.)
 * @route PUT /api/v1/cards/:id/flags
 */
const updateCardFlags = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isLeeched, isMarked, isSuspended } = req.body;
    
    const card = await Card.findById(id);
    
    if (!card) {
      return next(notFound(`Card with ID ${id} not found`));
    }
    
    // Check if user has permission
    const deck = await Deck.findById(card.deck);
    
    if (!deck) {
      return next(notFound(`Deck for this card not found`));
    }
    
    const isOwner = deck.owner.toString() === req.user.id;
    const isCardOwner = card.owner.toString() === req.user.id;
    const isCollaborator = deck.collaborators.some(
      c => c.user.toString() === req.user.id && ['editor', 'admin'].includes(c.role)
    );
    
    if (!isOwner && !isCardOwner && !isCollaborator) {
      return next(forbidden('You do not have permission to update this card'));
    }
    
    // Update flags
    if (isLeeched !== undefined) card.flags.isLeeched = isLeeched;
    if (isMarked !== undefined) card.flags.isMarked = isMarked;
    if (isSuspended !== undefined) card.flags.isSuspended = isSuspended;
    
    // Save updated card
    await card.save();
    
    return res.success(card, 'Card flags updated successfully');
  } catch (error) {
    logger.error(`Error updating flags for card ${req.params.id}:`, error);
    return next(error);
  }
};

/**
 * Move a card to a different deck
 * @route PUT /api/v1/cards/:id/move
 */
const moveCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetDeckId } = req.body;
    
    if (!targetDeckId) {
      return next(new AppError('Target deck ID is required', 400));
    }
    
    const card = await Card.findById(id);
    
    if (!card) {
      return next(notFound(`Card with ID ${id} not found`));
    }
    
    // Check source deck permissions
    const sourceDeck = await Deck.findById(card.deck);
    
    if (!sourceDeck) {
      return next(notFound(`Source deck not found`));
    }
    
    const isSourceOwner = sourceDeck.owner.toString() === req.user.id;
    const isCardOwner = card.owner.toString() === req.user.id;
    const isSourceCollaborator = sourceDeck.collaborators.some(
      c => c.user.toString() === req.user.id && ['editor', 'admin'].includes(c.role)
    );
    
    if (!isSourceOwner && !isCardOwner && !isSourceCollaborator) {
      return next(forbidden('You do not have permission to move this card from its current deck'));
    }
    
    // Check target deck permissions
    const targetDeck = await Deck.findById(targetDeckId);
    
    if (!targetDeck) {
      return next(notFound(`Target deck with ID ${targetDeckId} not found`));
    }
    
    const isTargetOwner = targetDeck.owner.toString() === req.user.id;
    const isTargetCollaborator = targetDeck.collaborators.some(
      c => c.user.toString() === req.user.id && ['editor', 'admin'].includes(c.role)
    );
    
    if (!isTargetOwner && !isTargetCollaborator) {
      return next(forbidden('You do not have permission to add cards to the target deck'));
    }
    
    // Get max position in target deck
    const highestPositionCard = await Card.findOne(
      { deck: targetDeckId },
      { position: 1 },
      { sort: { position: -1 } }
    );
    
    const newPosition = highestPositionCard ? highestPositionCard.position + 1 : 1;
    
    // Store old deck ID for statistics update
    const oldDeckId = card.deck;
    
    // Update card
    card.deck = targetDeckId;
    card.position = newPosition;
    await card.save();
    
    // Update statistics for both decks
    sourceDeck.statistics.totalCards -= 1;
    await sourceDeck.save();
    
    targetDeck.statistics.totalCards += 1;
    await targetDeck.save();
    
    return res.success(card, 'Card moved successfully');
  } catch (error) {
    logger.error(`Error moving card ${req.params.id}:`, error);
    return next(error);
  }
};

/**
 * Clone a card to another deck
 * @route POST /api/v1/cards/:id/clone
 */
const cloneCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetDeckId } = req.body;
    
    if (!targetDeckId) {
      return next(new AppError('Target deck ID is required', 400));
    }
    
    const card = await Card.findById(id);
    
    if (!card) {
      return next(notFound(`Card with ID ${id} not found`));
    }
    
    // Check source deck permissions for viewing
    const sourceDeck = await Deck.findById(card.deck);
    
    if (!sourceDeck) {
      return next(notFound(`Source deck not found`));
    }
    
    const isSourceOwner = sourceDeck.owner.toString() === req.user.id;
    const isSourceCollaborator = sourceDeck.collaborators.some(
      c => c.user.toString() === req.user.id
    );
    const isSourcePublic = sourceDeck.visibility === 'public';
    
    if (!isSourceOwner && !isSourceCollaborator && !isSourcePublic) {
      return next(forbidden('You do not have permission to view this card'));
    }
    
    // Check target deck permissions for adding
    const targetDeck = await Deck.findById(targetDeckId);
    
    if (!targetDeck) {
      return next(notFound(`Target deck with ID ${targetDeckId} not found`));
    }
    
    const isTargetOwner = targetDeck.owner.toString() === req.user.id;
    const isTargetCollaborator = targetDeck.collaborators.some(
      c => c.user.toString() === req.user.id && ['editor', 'admin'].includes(c.role)
    );
    
    if (!isTargetOwner && !isTargetCollaborator) {
      return next(forbidden('You do not have permission to add cards to the target deck'));
    }
    
    // Get max position in target deck
    const highestPositionCard = await Card.findOne(
      { deck: targetDeckId },
      { position: 1 },
      { sort: { position: -1 } }
    );
    
    const newPosition = highestPositionCard ? highestPositionCard.position + 1 : 1;
    
    // Create clone
    const clone = new Card({
      deck: targetDeckId,
      owner: req.user.id,
      front: card.front,
      back: card.back,
      type: card.type,
      tags: card.tags,
      position: newPosition,
      notes: card.notes,
      source: {
        type: 'imported',
        reference: `Cloned from card ${card._id}`,
      },
      lastModifiedBy: req.user.id,
    });
    
    await clone.save();
    
    // Update target deck statistics
    targetDeck.statistics.totalCards += 1;
    targetDeck.statistics.newCards += 1;
    await targetDeck.save();
    
    return res.success(clone, 'Card cloned successfully');
  } catch (error) {
    logger.error(`Error cloning card ${req.params.id}:`, error);
    return next(error);
  }
};

module.exports = {
  createCard,
  getCardsByDeck,
  getCardById,
  updateCard,
  deleteCard,
  bulkCreateCards,
  reorderCard,
  updateCardFlags,
  moveCard,
  cloneCard
};
