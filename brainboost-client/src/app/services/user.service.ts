import api from './api';

/**
 * User service for handling user profile-related operations
 */
const userService = {
  /**
   * Get user profile
   * @returns {Promise<Object>} User profile data
   */
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  },

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated user profile
   */
  async updateProfile(profileData: Record<string, any>) {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  /**
   * Update user password
   * @param {Object} passwordData - Password update data
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Promise<Object>} Response data
   */
  async updatePassword({
    currentPassword,
    newPassword,
  }: {
    currentPassword: string;
    newPassword: string;
  }) {
    const response = await api.put('/users/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Update user preferences
   * @param {Object} preferences - User preferences
   * @returns {Promise<Object>} Updated user profile
   */
  async updatePreferences(preferences: Record<string, any>) {
    const response = await api.put('/users/preferences', { preferences });
    return response.data;
  },

  /**
   * Delete user account
   * @param {string} password - User password for confirmation
   * @returns {Promise<Object>} Response data
   */
  async deleteAccount(password: string) {
    const response = await api.delete('/users/account', {
      data: { password },
    });
    return response.data;
  },
};

export default userService;
