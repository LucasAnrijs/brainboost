const express = require('express');
const { authLimiter } = require('../../../middleware/rate-limiter');
const { validate } = require('../../../middleware/validation');
const authValidation = require('./auth.validation');
const authController = require('./auth.controller');

const router = express.Router();

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  authLimiter,
  validate(authValidation.register),
  authController.register
);

/**
 * @route POST /api/v1/auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  authLimiter,
  validate(authValidation.login),
  authController.login
);

/**
 * @route POST /api/v1/auth/refresh-token
 * @desc Refresh authentication token
 * @access Public
 */
router.post(
  '/refresh-token',
  validate(authValidation.refreshToken),
  authController.refreshToken
);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user
 * @access Public
 */
router.post('/logout', authController.logout);

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post(
  '/forgot-password',
  authLimiter,
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);

/**
 * @route POST /api/v1/auth/reset-password/:token
 * @desc Reset password with token
 * @access Public
 */
router.post(
  '/reset-password/:token',
  authLimiter,
  validate(authValidation.resetPassword),
  authController.resetPassword
);

/**
 * @route GET /api/v1/auth/verify-email/:token
 * @desc Verify email address
 * @access Public
 */
router.get('/verify-email/:token', authController.verifyEmail);

module.exports = router;
