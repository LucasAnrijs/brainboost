/**
 * Deck Controller
 * Handles API requests related to flashcard decks
 */

const Deck = require('../../../models/deck.model');
const Card = require('../../../models/card.model');
const { AppError, notFound, forbidden } = require('../../../utils/errors/app-error');
const logger = require('../../../utils/logging/logger').logger;

/**
 * Create a new deck
 * @route POST /api/v1/decks
 */
const createDeck = async (req, res, next) => {
  try {
    const { title, description, tags, category, visibility, coverImage } = req.body;
    
    // Create new deck with current user as owner
    const deck = new Deck({
      title,
      description,
      tags,
      category,
      visibility: visibility || 'private',
      owner: req.user.id,
      coverImage,
    });

    await deck.save();
    
    return res.success(deck, 'Deck created successfully');
  } catch (error) {
    logger.error('Error creating deck:', error);
    return next(error);
  }
};

/**
 * Get all decks for the current user
 * @route GET /api/v1/decks
 */
const getDecks = async (req, res, next) => {
  try {
    // Extract query parameters for filtering
    const { search, tag, category, visibility, archived, sort = 'updatedAt', order = 'desc' } = req.query;
    
    // Build the filter query
    let query = { 
      $or: [
        { owner: req.user.id }, // Decks owned by user
        { 'collaborators.user': req.user.id } // Decks where user is a collaborator
      ]
    };
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add tag filter
    if (tag) {
      query.tags = tag;
    }
    
    // Add category filter
    if (category) {
      query.category = category;
    }
    
    // Add visibility filter
    if (visibility) {
      query.visibility = visibility;
    }
    
    // Add archived filter
    if (archived !== undefined) {
      query.isArchived = archived === 'true';
    }
    
    // Build the sort option
    const sortOption = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;
    
    // Get decks with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const decks = await Deck.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await Deck.countDocuments(query);
    
    return res.success({
      decks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Decks retrieved successfully');
  } catch (error) {
    logger.error('Error getting decks:', error);
    return next(error);
  }
};

/**
 * Get a deck by ID
 * @route GET /api/v1/decks/:id
 */
const getDeckById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const deck = await Deck.findById(id).lean();
    
    if (!deck) {
      return next(notFound(`Deck with ID ${id} not found`));
    }
    
    // Check if user has access to this deck
    const isOwner = deck.owner.toString() === req.user.id;
    const isCollaborator = deck.collaborators.some(c => c.user.toString() === req.user.id);
    const isPublic = deck.visibility === 'public';
    
    if (!isOwner && !isCollaborator && !isPublic) {
      return next(forbidden('You do not have permission to access this deck'));
    }
    
    // Get card count
    const cardCount = await Card.countDocuments({ deck: id });
    
    // Add card count to the deck object
    deck.cardCount = cardCount;
    
    return res.success(deck, 'Deck retrieved successfully');
  } catch (error) {
    logger.error(`Error getting deck ${req.params.id}:`, error);
    return next(error);
  }
};

/**
 * Update a deck
 * @route PUT /api/v1/decks/:id
 */
const updateDeck = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, tags, category, visibility, coverImage, settings } = req.body;
    
    // Find the deck
    const deck = await Deck.findById(id);
    
    if (!deck) {
      return next(notFound(`Deck with ID ${id} not found`));
    }
    
    // Check if user has permission to update
    const isOwner = deck.owner.toString() === req.user.id;
    const isEditor = deck.collaborators.some(
      c => c.user.toString() === req.user.id && ['editor', 'admin'].includes(c.role)
    );
    
    if (!isOwner && !isEditor) {
      return next(forbidden('You do not have permission to update this deck'));
    }
    
    // Update the deck
    if (title) deck.title = title;
    if (description !== undefined) deck.description = description;
    if (tags) deck.tags = tags;
    if (category) deck.category = category;
    if (visibility && isOwner) deck.visibility = visibility; // Only owner can change visibility
    if (coverImage) deck.coverImage = coverImage;
    
    // Update settings if provided
    if (settings) {
      if (settings.newCardsPerDay) deck.settings.newCardsPerDay = settings.newCardsPerDay;
      if (settings.reviewsPerDay) deck.settings.reviewsPerDay = settings.reviewsPerDay;
      if (settings.orderNewCards) deck.settings.orderNewCards = settings.orderNewCards;
      if (settings.orderReviews) deck.settings.orderReviews = settings.orderReviews;
    }
    
    // Save the updated deck
    await deck.save();
    
    return res.success(deck, 'Deck updated successfully');
  } catch (error) {
    logger.error(`Error updating deck ${req.params.id}:`, error);
    return next(error);
  }
};

/**
 * Delete a deck
 * @route DELETE /api/v1/decks/:id
 */
const deleteDeck = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the deck
    const deck = await Deck.findById(id);
    
    if (!deck) {
      return next(notFound(`Deck with ID ${id} not found`));
    }
    
    // Check if user has permission to delete
    const isOwner = deck.owner.toString() === req.user.id;
    
    if (!isOwner) {
      return next(forbidden('Only the owner can delete a deck'));
    }
    
    // Delete all cards in the deck
    await Card.deleteMany({ deck: id });
    
    // Delete the deck
    await deck.deleteOne();
    
    return res.success({ id }, 'Deck deleted successfully');
  } catch (error) {
    logger.error(`Error deleting deck ${req.params.id}:`, error);
    return next(error);
  }
};

/**
 * Toggle deck visibility (public/private)
 * @route PUT /api/v1/decks/:id/visibility
 */
const toggleVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;
    
    if (!['private', 'shared', 'public'].includes(visibility)) {
      return next(new AppError('Invalid visibility value', 400));
    }
    
    // Find the deck
    const deck = await Deck.findById(id);
    
    if (!deck) {
      return next(notFound(`Deck with ID ${id} not found`));
    }
    
    // Check if user is the owner
    if (deck.owner.toString() !== req.user.id) {
      return next(forbidden('Only the owner can change deck visibility'));
    }
    
    // Update visibility
    deck.visibility = visibility;
    await deck.save();
    
    return res.success(deck, 'Deck visibility updated successfully');
  } catch (error) {
    logger.error(`Error updating visibility for deck ${req.params.id}:`, error);
    return next(error);
  }
};

/**
 * Get public decks
 * @route GET /api/v1/decks/public
 */
const getPublicDecks = async (req, res, next) => {
  try {
    // Extract query parameters
    const { search, tag, category, sort = 'updatedAt', order = 'desc' } = req.query;
    
    // Build the filter query
    let query = { visibility: 'public', isArchived: false };
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add tag filter
    if (tag) {
      query.tags = tag;
    }
    
    // Add category filter
    if (category) {
      query.category = category;
    }
    
    // Build the sort option
    const sortOption = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;
    
    // Get decks with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const decks = await Deck.find(query)
      .populate('owner', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await Deck.countDocuments(query);
    
    return res.success({
      decks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Public decks retrieved successfully');
  } catch (error) {
    logger.error('Error getting public decks:', error);
    return next(error);
  }
};

/**
 * Add a collaborator to a deck
 * @route POST /api/v1/decks/:id/collaborators
 */
const addCollaborator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    
    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return next(new AppError('Invalid role value', 400));
    }
    
    // Find the deck
    const deck = await Deck.findById(id);
    
    if (!deck) {
      return next(notFound(`Deck with ID ${id} not found`));
    }
    
    // Check if user is the owner or admin collaborator
    const isOwner = deck.owner.toString() === req.user.id;
    const isAdmin = deck.collaborators.some(
      c => c.user.toString() === req.user.id && c.role === 'admin'
    );
    
    if (!isOwner && !isAdmin) {
      return next(forbidden('You do not have permission to add collaborators'));
    }
    
    // Check if user is already a collaborator
    const existingCollaborator = deck.collaborators.find(c => c.user.toString() === userId);
    
    if (existingCollaborator) {
      return next(new AppError('User is already a collaborator', 400));
    }
    
    // Add collaborator
    deck.collaborators.push({
      user: userId,
      role,
      addedAt: new Date()
    });
    
    await deck.save();
    
    return res.success(deck, 'Collaborator added successfully');
  } catch (error) {
    logger.error(`Error adding collaborator to deck ${req.params.id}:`, error);
    return next(error);
  }
};

/**
 * Update a collaborator's role
 * @route PUT /api/v1/decks/:id/collaborators/:userId
 */
const updateCollaborator = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;
    
    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return next(new AppError('Invalid role value', 400));
    }
    
    // Find the deck
    const deck = await Deck.findById(id);
    
    if (!deck) {
      return next(notFound(`Deck with ID ${id} not found`));
    }
    
    // Check if user is the owner or admin collaborator
    const isOwner = deck.owner.toString() === req.user.id;
    const isAdmin = deck.collaborators.some(
      c => c.user.toString() === req.user.id && c.role === 'admin'
    );
    
    if (!isOwner && !isAdmin) {
      return next(forbidden('You do not have permission to update collaborators'));
    }
    
    // Find the collaborator
    const collaboratorIndex = deck.collaborators.findIndex(c => c.user.toString() === userId);
    
    if (collaboratorIndex === -1) {
      return next(notFound('Collaborator not found'));
    }
    
    // Update role
    deck.collaborators[collaboratorIndex].role = role;
    
    await deck.save();
    
    return res.success(deck, 'Collaborator role updated successfully');
  } catch (error) {
    logger.error(`Error updating collaborator in deck ${req.params.id}:`, error);
    return next(error);
  }
};

/**
 * Remove a collaborator from a deck
 * @route DELETE /api/v1/decks/:id/collaborators/:userId
 */
const removeCollaborator = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    
    // Find the deck
    const deck = await Deck.findById(id);
    
    if (!deck) {
      return next(notFound(`Deck with ID ${id} not found`));
    }
    
    // Check if user is the owner, admin collaborator, or removing themselves
    const isOwner = deck.owner.toString() === req.user.id;
    const isAdmin = deck.collaborators.some(
      c => c.user.toString() === req.user.id && c.role === 'admin'
    );
    const isSelf = userId === req.user.id;
    
    if (!isOwner && !isAdmin && !isSelf) {
      return next(forbidden('You do not have permission to remove collaborators'));
    }
    
    // Remove collaborator
    deck.collaborators = deck.collaborators.filter(c => c.user.toString() !== userId);
    
    await deck.save();
    
    return res.success({ id, userId }, 'Collaborator removed successfully');
  } catch (error) {
    logger.error(`Error removing collaborator from deck ${req.params.id}:`, error);
    return next(error);
  }
};

/**
 * Copy a public deck to user's collection
 * @route POST /api/v1/decks/:id/copy
 */
const copyDeck = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    // Find the source deck
    const sourceDeck = await Deck.findById(id);
    
    if (!sourceDeck) {
      return next(notFound(`Deck with ID ${id} not found`));
    }
    
    // Check if the deck is public
    if (sourceDeck.visibility !== 'public') {
      return next(forbidden('You can only copy public decks'));
    }
    
    // Create a new deck with the same content but new owner
    const newDeck = new Deck({
      title: title || `Copy of ${sourceDeck.title}`,
      description: sourceDeck.description,
      owner: req.user.id,
      tags: sourceDeck.tags,
      category: sourceDeck.category,
      visibility: 'private', // Default to private
      coverImage: sourceDeck.coverImage,
      settings: sourceDeck.settings,
      parentDeck: sourceDeck._id, // Reference to original
    });
    
    await newDeck.save();
    
    // Find all cards in the source deck
    const sourceCards = await Card.find({ deck: id });
    
    // Create copies of the cards in the new deck
    if (sourceCards.length > 0) {
      const cardCopies = sourceCards.map(card => ({
        deck: newDeck._id,
        front: card.front,
        back: card.back,
        hint: card.hint,
        tags: card.tags,
        media: card.media,
        owner: req.user.id,
      }));
      
      await Card.insertMany(cardCopies);
      
      // Update the deck with the correct card count
      newDeck.statistics.totalCards = cardCopies.length;
      newDeck.statistics.newCards = cardCopies.length;
      await newDeck.save();
    }
    
    return res.success(newDeck, 'Deck copied successfully');
  } catch (error) {
    logger.error(`Error copying deck ${req.params.id}:`, error);
    return next(error);
  }
};

/**
 * Archive/Unarchive a deck
 * @route PUT /api/v1/decks/:id/archive
 */
const toggleArchive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { archived } = req.body;
    
    // Find the deck
    const deck = await Deck.findById(id);
    
    if (!deck) {
      return next(notFound(`Deck with ID ${id} not found`));
    }
    
    // Check if user is the owner
    if (deck.owner.toString() !== req.user.id) {
      return next(forbidden('Only the owner can archive or unarchive a deck'));
    }
    
    // Update archive status
    deck.isArchived = archived;
    await deck.save();
    
    return res.success(deck, `Deck ${archived ? 'archived' : 'unarchived'} successfully`);
  } catch (error) {
    logger.error(`Error toggling archive status for deck ${req.params.id}:`, error);
    return next(error);
  }
};

module.exports = {
  createDeck,
  getDecks,
  getDeckById,
  updateDeck,
  deleteDeck,
  toggleVisibility,
  getPublicDecks,
  addCollaborator,
  updateCollaborator,
  removeCollaborator,
  copyDeck,
  toggleArchive
};
