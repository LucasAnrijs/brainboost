const { User } = require('../../models');
const { notFound, badRequest, unauthorized } = require('../../utils/errors/app-error');

/**
 * User service
 * Contains business logic for user profile management
 */
const userService = {
  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<User>} User document
   */
  getUserById: async (userId) => {
    const user = await User.findById(userId);
    
    if (!user) {
      throw notFound('User not found');
    }
    
    if (!user.active) {
      throw notFound('User account is inactive');
    }
    
    return user;
  },
  
  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @param {string} [updates.name] - User name
   * @param {string} [updates.profileImage] - Profile image URL
   * @returns {Promise<User>} Updated user
   */
  updateProfile: async (userId, updates) => {
    const allowedUpdates = {};
    
    if (updates.name !== undefined) allowedUpdates.name = updates.name;
    if (updates.profileImage !== undefined) allowedUpdates.profileImage = updates.profileImage;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      throw notFound('User not found');
    }
    
    return updatedUser;
  },
  
  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - User preferences
   * @returns {Promise<Object>} Updated preferences
   */
  updatePreferences: async (userId, preferences) => {
    // Get user
    const user = await User.findById(userId);
    
    if (!user) {
      throw notFound('User not found');
    }
    
    // Merge current preferences with updates
    const currentPreferences = user.preferences || {};
    const mergedPreferences = {
      ...currentPreferences,
      ...preferences,
    };
    
    // Update user
    user.preferences = mergedPreferences;
    await user.save();
    
    return user.preferences;
  },
  
  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success indicator
   */
  updatePassword: async (userId, currentPassword, newPassword) => {
    // Get user with password
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw notFound('User not found');
    }
    
    // Check if current password is correct
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      throw unauthorized('Current password is incorrect');
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    return true;
  },
  
  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @param {string} password - User password for confirmation
   * @returns {Promise<boolean>} Success indicator
   */
  deactivateAccount: async (userId, password) => {
    // Get user with password
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw notFound('User not found');
    }
    
    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      throw unauthorized('Password is incorrect');
    }
    
    // Deactivate account
    user.active = false;
    await user.save();
    
    return true;
  },
  
  /**
   * Get user statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User statistics
   */
  getUserStatistics: async (userId) => {
    const user = await User.findById(userId);
    
    if (!user) {
      throw notFound('User not found');
    }
    
    return user.statistics;
  },
  
  /**
   * Update user streak
   * @param {string} userId - User ID
   * @param {Date} studyDate - Date of study activity
   * @returns {Promise<Object>} Updated streak information
   */
  updateUserStreak: async (userId, studyDate = new Date()) => {
    const user = await User.findById(userId);
    
    if (!user) {
      throw notFound('User not found');
    }
    
    await user.updateStreak(studyDate);
    
    return {
      currentStreak: user.statistics.currentStreak,
      longestStreak: user.statistics.longestStreak,
      lastStudyDate: user.statistics.lastStudyDate,
    };
  },
};

module.exports = userService;
