const { User } = require('../models');
const authService = require('../services/auth-service/auth.service');
const { unauthorized, forbidden } = require('../utils/errors/app-error');

/**
 * Middleware to authenticate user and attach to request
 * Verifies JWT token from Authorization header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(unauthorized('Authentication required'));
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(unauthorized('Authentication required'));
    }
    
    // Validate token using auth service
    const decoded = await authService.validateToken(token);
    
    // Find user by ID
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(unauthorized('Invalid token. User not found'));
    }
    
    // Update last active timestamp
    await user.updateLastActive();
    
    // Attach user to request object
    req.user = user;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has required role
 * Must be used after authenticate middleware
 * @param  {...string} roles - Authorized roles
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(unauthorized('Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(forbidden('You do not have permission to perform this action'));
    }
    
    next();
  };
};

/**
 * Middleware to check if user owns a resource or is an admin
 * @param {string} modelName - Model name ('Deck', 'Card', etc.)
 * @param {string} paramName - URL parameter name containing resource ID (default: 'id')
 * @returns {Function} Express middleware
 */
const ownerOrAdmin = (modelName, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(unauthorized('Authentication required'));
      }
      
      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }
      
      const Model = require(`../models`)[modelName];
      const resourceId = req.params[paramName];
      
      if (!resourceId) {
        return next(forbidden('Resource ID is required'));
      }
      
      // Find resource by ID
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return next({ statusCode: 404, message: `${modelName} not found` });
      }
      
      // Check if user is owner
      const isOwner = resource.owner && resource.owner.toString() === req.user._id.toString();
      
      // Check if user is collaborator with appropriate role
      const isCollaborator = resource.collaborators && resource.collaborators.some(
        collab => collab.user.toString() === req.user._id.toString() && 
                 ['editor', 'admin'].includes(collab.role)
      );
      
      if (!isOwner && !isCollaborator) {
        return next(forbidden('You do not have permission to perform this action on this resource'));
      }
      
      // Attach resource to request
      req.resource = resource;
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  ownerOrAdmin,
};
