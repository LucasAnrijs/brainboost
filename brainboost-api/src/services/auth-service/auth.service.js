const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../../models');
const config = require('../../config/app');
const { badRequest, unauthorized, notFound } = require('../../utils/errors/app-error');

/**
 * Authentication service
 * Contains business logic for user authentication
 */
const authService = {
  /**
   * Create a new user
   * @param {Object} userData - User data for registration
   * @param {string} userData.name - User name
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @returns {Promise<Object>} Created user and token
   */
  createUser: async (userData) => {
    const { name, email, password } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw badRequest('User with this email already exists');
    }
    
    // Create a new user
    const user = new User({
      name,
      email,
      password,
      emailVerificationToken: crypto.randomBytes(20).toString('hex'),
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    // Create sanitized user object for response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: user.preferences,
      createdAt: user.createdAt,
    };
    
    return { user: userResponse, token };
  },
  
  /**
   * Authenticate user and generate token
   * @param {Object} credentials - User login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} User data and tokens
   */
  authenticateUser: async (credentials) => {
    const { email, password } = credentials;
    
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      throw unauthorized('Invalid email or password');
    }
    
    // Check if account is active
    if (!user.active) {
      throw unauthorized('Your account has been deactivated');
    }
    
    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw unauthorized('Invalid email or password');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user._id },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
    
    // Update last active timestamp
    await user.updateLastActive();
    
    // Create sanitized user object for response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: user.preferences,
      statistics: user.statistics,
      createdAt: user.createdAt,
    };
    
    return { user: userResponse, token, refreshToken };
  },
  
  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New access and refresh tokens
   */
  refreshToken: async (refreshToken) => {
    if (!refreshToken) {
      throw unauthorized('Refresh token is required');
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.secret);
    } catch (error) {
      throw unauthorized('Invalid or expired refresh token');
    }
    
    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (!user || !user.active) {
      throw unauthorized('User not found or inactive');
    }
    
    // Generate new access token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    // Generate new refresh token (for rotation)
    const newRefreshToken = jwt.sign(
      { id: user._id },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
    
    return { token, refreshToken: newRefreshToken };
  },
  
  /**
   * Create password reset token for user
   * @param {string} email - User email
   * @returns {Promise<{resetToken: string, user: User}>} Reset token and user
   */
  createPasswordResetToken: async (email) => {
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // For security, don't reveal that user doesn't exist
      // but return null values
      return { resetToken: null, user: null };
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and save to user
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save({ validateBeforeSave: false });
    
    return { resetToken, user };
  },
  
  /**
   * Reset user password using token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<string>} Authentication token
   */
  resetPassword: async (token, password) => {
    // Hash the provided token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    
    if (!user) {
      throw badRequest('Invalid or expired password reset token');
    }
    
    // Update user password and clear reset token
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    // Generate new auth token
    const authToken = jwt.sign(
      { id: user._id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    return authToken;
  },
  
  /**
   * Verify user email address
   * @param {string} token - Email verification token
   * @returns {Promise<boolean>} Success status
   */
  verifyEmail: async (token) => {
    // Find user with matching verification token
    const user = await User.findOne({ emailVerificationToken: token });
    
    if (!user) {
      throw badRequest('Invalid or expired verification token');
    }
    
    // Mark email as verified and clear token
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    
    await user.save({ validateBeforeSave: false });
    
    return true;
  },
  
  /**
   * Validate authentication token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Decoded token payload
   */
  validateToken: async (token) => {
    if (!token) {
      throw unauthorized('Authentication token is required');
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Check if user exists and is active
      const user = await User.findById(decoded.id);
      
      if (!user || !user.active) {
        throw unauthorized('User not found or inactive');
      }
      
      return decoded;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw unauthorized('Invalid token');
      } else if (error.name === 'TokenExpiredError') {
        throw unauthorized('Token has expired');
      }
      
      throw error;
    }
  },
};

module.exports = authService;
