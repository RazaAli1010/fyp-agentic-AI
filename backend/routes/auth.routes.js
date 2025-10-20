const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const {
  authenticate,
  authRateLimit,
  verifyRefreshToken,
  attachRequestMetadata,
  isAccountOwner
} = require('../middleware/auth.middleware');
const { 
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validatePasswordChange,
  validateProfileUpdate,
  validateEmail
} = require('../middleware/validation');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authRateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  attachRequestMetadata,
  validateRegistration,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return tokens
 * @access  Public
 */
router.post(
  '/login',
  authRateLimit(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
  attachRequestMetadata,
  validateLogin,
  authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  attachRequestMetadata,
  authController.logout
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices (clear all refresh tokens)
 * @access  Private
 */
router.post(
  '/logout-all',
  authenticate,
  attachRequestMetadata,
  authController.logoutAll
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Get new access token using refresh token
 * @access  Public (requires refresh token)
 */
router.post(
  '/refresh-token',
  authRateLimit(10, 15 * 60 * 1000),
  verifyRefreshToken,
  authController.refreshToken
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
  '/forgot-password',
  authRateLimit(3, 15 * 60 * 1000), // 3 attempts per 15 minutes
  attachRequestMetadata,
  validateEmail,
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password using token from email
 * @access  Public
 */
router.post(
  '/reset-password/:token',
  authRateLimit(5, 15 * 60 * 1000),
  attachRequestMetadata,
  validatePasswordReset,
  authController.resetPassword
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password for logged-in user
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  attachRequestMetadata,
  validatePasswordChange,
  authController.changePassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile (name, email, company)
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  validateProfileUpdate,
  authController.updateProfile
);

/**
 * @route   GET /api/auth/verify-token
 * @desc    Verify if current token is valid
 * @access  Private
 */
router.get(
  '/verify-token',
  authenticate,
  authController.verifyToken
);

/**
 * @route   GET /api/auth/activity-logs
 * @desc    Get user's authentication activity logs
 * @access  Private
 */
router.get(
  '/activity-logs',
  authenticate,
  authController.getActivityLogs
);

/**
 * @route   GET /api/auth/active-sessions
 * @desc    Get all active sessions (refresh tokens)
 * @access  Private
 */
router.get(
  '/active-sessions',
  authenticate,
  authController.getActiveSessions
);

/**
 * @route   DELETE /api/auth/sessions/:tokenId
 * @desc    Revoke a specific session (remove refresh token)
 * @access  Private
 */
router.delete(
  '/sessions/:tokenId',
  authenticate,
  authController.revokeSession
);

/**
 * @route   POST /api/auth/check-username
 * @desc    Check if username is available
 * @access  Public
 */
router.post(
  '/check-username',
  authController.checkUsernameAvailability
);

/**
 * @route   POST /api/auth/check-email
 * @desc    Check if email is available
 * @access  Public
 */
router.post(
  '/check-email',
  authController.checkEmailAvailability
);

/**
 * @route   GET /api/auth/account-status
 * @desc    Check account lock status
 * @access  Public (requires email or username)
 */
router.get(
  '/account-status',
  authController.checkAccountStatus
);

/**
 * @route   POST /api/auth/unlock-account
 * @desc    Request account unlock (for locked accounts)
 * @access  Public
 */
router.post(
  '/unlock-account',
  authRateLimit(3, 60 * 60 * 1000), // 3 attempts per hour
  validateEmail,
  authController.requestAccountUnlock
);

/**
 * @route   POST /api/auth/verify-reset-token/:token
 * @desc    Verify if password reset token is valid
 * @access  Public
 */
router.post(
  '/verify-reset-token/:token',
  authController.verifyPasswordResetToken
);

/**
 * @route   DELETE /api/auth/account
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete(
  '/account',
  authenticate,
  authController.deactivateAccount
);

/**
 * @route   POST /api/auth/reactivate-account
 * @desc    Reactivate deactivated account
 * @access  Public
 */
router.post(
  '/reactivate-account',
  authRateLimit(5, 15 * 60 * 1000),
  validateLogin,
  authController.reactivateAccount
);

module.exports = router;