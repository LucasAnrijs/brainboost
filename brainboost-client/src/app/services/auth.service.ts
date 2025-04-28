import api from './api';

/**
 * Authentication service for handling login, registration, and auth-related operations
 */
const authService = {
  /**
   * Login user
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} User data and token
   */
  async login({ email, password }: { email: string; password: string }) {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  },

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User name
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @returns {Promise<Object>} User data and token
   */
  async register({ name, email, password }: { name: string; email: string; password: string }) {
    const response = await api.post('/auth/register', { name, email, password });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  },

  /**
   * Logout user
   */
  async logout() {
    localStorage.removeItem('token');
    // Optional: Call API to invalidate token on server
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if this fails, we still want to remove local token
      console.error('Error logging out on server:', error);
    }
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Response data
   */
  async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} Response data
   */
  async resetPassword(token: string, password: string) {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};

export default authService;
