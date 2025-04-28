const authService = require('../../../services/auth-service/auth.service');
const { logger } = require('../../../utils/logging/logger');

/**
 * Authentication Controller
 * Handles user registration, login, token refresh, and password reset
 */
const authController = {
  /**
   * Register a new user
   * @route POST /api/v1/auth/register
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  register: async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      
      // Create user through service layer
      const { user, token } = await authService.createUser({ name, email, password });
      
      // Log successful registration
      logger.info(`User registered: ${email}`);
      
      // Send response
      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        token,
        user,
      });
      
      // TODO: Send welcome email with verification link
      
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Login user
   * @route POST /api/v1/auth/login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      // Authenticate user through service layer
      const { user, token, refreshToken } = await authService.authenticateUser({ email, password });
      
      // Log successful login
      logger.info(`User logged in: ${email}`);
      
      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      
      // Send response
      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        token,
        user,
      });
      
    } catch (error) {
      // Log failed login attempt
      if (error.statusCode === 401) {
        logger.warn(`Failed login attempt: ${req.body.email}`);
      }
      
      next(error);
    }
  },
  
  /**
   * Refresh authentication token
   * @route POST /api/v1/auth/refresh-token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  refreshToken: async (req, res, next) => {
    try {
      // Get refresh token from cookie or request body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      // Get new tokens through service layer
      const { token, refreshToken: newRefreshToken } = await authService.refreshToken(refreshToken);
      
      // Set new refresh token cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      
      // Send response
      res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully',
        token,
        refreshToken: newRefreshToken,
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Logout user
   * @route POST /api/v1/auth/logout
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  logout: (req, res) => {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    // Send response
    res.status(200).json({
      status: 'success',
      message: 'Logout successful',
    });
  },
  
  /**
   * Request password reset
   * @route POST /api/v1/auth/forgot-password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;
      
      // Create password reset token through service layer
      const { resetToken, user } = await authService.createPasswordResetToken(email);
      
      // Always return success even if user not found (security best practice)
      if (!user) {
        return res.status(200).json({
          status: 'success',
          message: 'Password reset instructions sent if email exists',
        });
      }
      
      // Generate reset URL
      const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
      
      // TODO: Send password reset email
      // For development, just log the URL
      logger.info(`Password reset URL for ${email}: ${resetURL}`);
      
      // Send response
      res.status(200).json({
        status: 'success',
        message: 'Password reset instructions sent if email exists',
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Reset password with token
   * @route POST /api/v1/auth/reset-password/:token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  resetPassword: async (req, res, next) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      // Reset password through service layer
      const authToken = await authService.resetPassword(token, password);
      
      // Log password reset
      logger.info('User reset password successfully');
      
      // Send response
      res.status(200).json({
        status: 'success',
        message: 'Password reset successful',
        token: authToken,
      });
      
      // TODO: Send password changed confirmation email
      
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Verify email address
   * @route GET /api/v1/auth/verify-email/:token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  verifyEmail: async (req, res, next) => {
    try {
      const { token } = req.params;
      
      // Verify email through service layer
      await authService.verifyEmail(token);
      
      // Send response
      res.status(200).json({
        status: 'success',
        message: 'Email verified successfully',
      });
      
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
