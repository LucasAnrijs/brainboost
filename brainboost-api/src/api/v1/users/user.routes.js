const express = require('express');
const { authenticate } = require('../../../middleware/auth.middleware');
const { validate } = require('../../../middleware/validation');
const userValidation = require('./user.validation');
const userController = require('./user.controller');

const router = express.Router();

/**
 * @route GET /api/v1/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get(
  '/profile',
  authenticate,
  userController.getProfile
);

/**
 * @route PUT /api/v1/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put(
  '/profile',
  authenticate,
  validate(userValidation.updateProfile),
  userController.updateProfile
);

/**
 * @route PUT /api/v1/users/preferences
 * @desc Update user preferences
 * @access Private
 */
router.put(
  '/preferences',
  authenticate,
  validate(userValidation.updatePreferences),
  userController.updatePreferences
);

/**
 * @route PUT /api/v1/users/password
 * @desc Update user password
 * @access Private
 */
router.put(
  '/password',
  authenticate,
  validate(userValidation.updatePassword),
  userController.updatePassword
);

/**
 * @route DELETE /api/v1/users/account
 * @desc Delete user account
 * @access Private
 */
router.delete(
  '/account',
  authenticate,
  validate(userValidation.deleteAccount),
  userController.deleteAccount
);

/**
 * @route GET /api/v1/users/stats
 * @desc Get user statistics
 * @access Private
 */
router.get(
  '/stats',
  authenticate,
  userController.getStats
);

module.exports = router;
