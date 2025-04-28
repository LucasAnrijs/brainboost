const userService = require('../../../services/user-service/user.service');
const { logger } = require('../../../utils/logging/logger');

/**
 * User Controller
 * Handles user profile management
 */
const userController = {
  /**
   * Get current user profile
   * @route GET /api/v1/users/profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  getProfile: async (req, res, next) => {
    try {
      // User is already attached to req by auth middleware
      const user = req.user;
      
      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            preferences: user.preferences,
            statistics: user.statistics,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update user profile
   * @route PUT /api/v1/users/profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  updateProfile: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { name, profileImage } = req.body;
      
      // Use service to update profile
      const updatedUser = await userService.updateProfile(userId, {
        name,
        profileImage,
      });
      
      // Log the action
      logger.info(`User ${userId} updated their profile`);
      
      // Return updated user
      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            profileImage: updatedUser.profileImage,
            preferences: updatedUser.preferences,
            statistics: updatedUser.statistics,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update user preferences
   * @route PUT /api/v1/users/preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  updatePreferences: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { preferences } = req.body;
      
      // Use service to update preferences
      const updatedPreferences = await userService.updatePreferences(
        userId,
        preferences
      );
      
      // Log the action
      logger.info(`User ${userId} updated their preferences`);
      
      // Return updated preferences
      res.status(200).json({
        status: 'success',
        message: 'Preferences updated successfully',
        data: {
          preferences: updatedPreferences,
        },
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update user password
   * @route PUT /api/v1/users/password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  updatePassword: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { currentPassword, newPassword } = req.body;
      
      // Use service to update password
      await userService.updatePassword(userId, currentPassword, newPassword);
      
      // Log the action
      logger.info(`User ${userId} updated their password`);
      
      // Return success response
      res.status(200).json({
        status: 'success',
        message: 'Password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Delete user account
   * @route DELETE /api/v1/users/account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  deleteAccount: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { password } = req.body;
      
      // Use service to deactivate account
      await userService.deactivateAccount(userId, password);
      
      // Log the action
      logger.info(`User ${userId} deactivated their account`);
      
      // Return success response
      res.status(200).json({
        status: 'success',
        message: 'Account successfully deactivated',
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get user statistics
   * @route GET /api/v1/users/stats
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  getStats: async (req, res, next) => {
    try {
      const userId = req.user._id;
      
      // Use service to get statistics
      const stats = await userService.getUserStatistics(userId);
      
      // Return statistics
      res.status(200).json({
        status: 'success',
        data: {
          statistics: stats,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = userController;
