const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('./email.service');

/**
 * Token Configuration
 */
const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  RESET_TOKEN_EXPIRY: 30 * 60 * 1000, // 30 minutes
  SECRET: process.env.JWT_SECRET
};

/**
 * Generate JWT Access Token
 * @param {string} userId - User ID
 * @param {object} additionalData - Additional data to include in token
 * @returns {string} JWT token
 */
const generateAccessToken = (userId, additionalData = {}) => {
  try {
    const payload = {
      userId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      ...additionalData
    };

    return jwt.sign(payload, TOKEN_CONFIG.SECRET, {
      expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY
    });
  } catch (error) {
    console.error('Access token generation error:', error);
    throw new Error('Failed to generate access token');
  }
};

/**
 * Generate JWT Refresh Token
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
const generateRefreshToken = (userId) => {
  try {
    const payload = {
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, TOKEN_CONFIG.SECRET, {
      expiresIn: TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY
    });
  } catch (error) {
    console.error('Refresh token generation error:', error);
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Generate both access and refresh tokens
 * @param {string} userId - User ID
 * @returns {object} Object containing both tokens
 */
const generateTokenPair = (userId) => {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId)
  };
};

/**
 * Verify JWT Token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
const verifyJwtToken = (token) => {
  try {
    return jwt.verify(token, TOKEN_CONFIG.SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not active yet');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Decode JWT token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {object} Decoded token
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

/**
 * Generate secure random token for password reset
 * @returns {string} Random token
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash token for storage
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result
 */
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calculate password strength score
 * @param {string} password - Password to evaluate
 * @returns {string} Strength level (weak, medium, strong, very strong)
 */
const calculatePasswordStrength = (password) => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  if (password.length >= 16) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  if (score <= 5) return 'strong';
  return 'very strong';
};

/**
 * Register new user
 * @param {object} userData - User registration data
 * @param {object} metadata - Request metadata (IP, user agent)
 * @returns {object} User and tokens
 */
const registerUser = async (userData, metadata = {}) => {
  try {
    const { username, email, password, name, companyName } = userData;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors[0]);
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new Error('Email already registered');
      }
      if (existingUser.username === username.toLowerCase()) {
        throw new Error('Username already taken');
      }
    }

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      name,
      companyName,
      role: 'owner'
    });

    await user.save();

    // Log registration
    if (metadata.ipAddress && metadata.userAgent) {
      await user.logAuthActivity(
        'registration',
        metadata.ipAddress,
        metadata.userAgent,
        true
      );
    }

    // Generate tokens
    const tokens = generateTokenPair(user._id);

    // Store refresh token
    await user.addRefreshToken(tokens.refreshToken);

    // Send welcome email (async)
    emailService.sendWelcomeEmail(user.email, user.name || user.username)
      .catch(err => console.error('Welcome email failed:', err));

    return {
      user: sanitizeUser(user),
      tokens
    };
  } catch (error) {
    console.error('Register user service error:', error);
    throw error;
  }
};

/**
 * Authenticate user with credentials
 * @param {string} emailOrUsername - Email or username
 * @param {string} password - Password
 * @param {object} metadata - Request metadata
 * @returns {object} User and tokens
 */
const authenticateUser = async (emailOrUsername, password, metadata = {}) => {
  try {
    // Find and verify user
    const user = await User.findByCredentials(emailOrUsername, password);

    // Generate tokens
    const tokens = generateTokenPair(user._id);

    // Store refresh token
    await user.addRefreshToken(tokens.refreshToken);

    // Update last login
    await user.updateLastLogin();

    // Log successful login
    if (metadata.ipAddress && metadata.userAgent) {
      await user.logAuthActivity(
        'login',
        metadata.ipAddress,
        metadata.userAgent,
        true
      );
    }

    return {
      user: sanitizeUser(user),
      tokens
    };
  } catch (error) {
    // Log failed attempt if user exists
    try {
      const user = await User.findOne({
        $or: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername.toLowerCase() }
        ]
      });

      if (user && metadata.ipAddress && metadata.userAgent) {
        await user.logAuthActivity(
          'failed_login',
          metadata.ipAddress,
          metadata.userAgent,
          false
        );
      }
    } catch (logError) {
      console.error('Failed to log authentication attempt:', logError);
    }

    throw error;
  }
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {object} New tokens
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = verifyJwtToken(refreshToken);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Verify token exists in user's tokens
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);

    if (!tokenExists) {
      throw new Error('Refresh token not found or revoked');
    }

    // Check account status
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    if (user.isLocked) {
      throw new Error('Account is locked');
    }

    // Generate new tokens
    const newTokens = generateTokenPair(user._id);

    // Replace old refresh token with new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(newTokens.refreshToken);

    return newTokens;
  } catch (error) {
    console.error('Refresh token service error:', error);
    throw error;
  }
};

/**
 * Initiate password reset process
 * @param {string} email - User email
 * @param {object} metadata - Request metadata
 * @returns {boolean} Success status
 */
const initiatePasswordReset = async (email, metadata = {}) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Return true even if user doesn't exist (security)
      return true;
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    await emailService.sendPasswordResetEmail(
      user.email,
      user.name || user.username,
      resetUrl
    );

    // Log activity
    if (metadata.ipAddress && metadata.userAgent) {
      await user.logAuthActivity(
        'password_reset_request',
        metadata.ipAddress,
        metadata.userAgent,
        true
      );
    }

    return true;
  } catch (error) {
    console.error('Password reset initiation error:', error);
    throw new Error('Failed to initiate password reset');
  }
};

/**
 * Reset password using token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @param {object} metadata - Request metadata
 * @returns {boolean} Success status
 */
const resetPassword = async (token, newPassword, metadata = {}) => {
  try {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors[0]);
    }

    // Find user by token
    const user = await User.findByResetToken(token);

    // Check password reuse
    const isReused = await user.isPasswordReused(newPassword);
    if (isReused) {
      throw new Error('Cannot reuse any of your last 5 passwords');
    }

    // Add current password to history
    await user.addPasswordToHistory(user.password);

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();

    // Clear all sessions
    await user.clearAllRefreshTokens();

    await user.save();

    // Log activity
    if (metadata.ipAddress && metadata.userAgent) {
      await user.logAuthActivity(
        'password_reset',
        metadata.ipAddress,
        metadata.userAgent,
        true
      );
    }

    // Send confirmation email
    emailService.sendPasswordChangedEmail(user.email, user.name || user.username)
      .catch(err => console.error('Password changed email failed:', err));

    return true;
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Change password for authenticated user
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @param {object} metadata - Request metadata
 * @returns {boolean} Success status
 */
const changePassword = async (userId, currentPassword, newPassword, metadata = {}) => {
  try {
    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors[0]);
    }

    // Get user with password
    const user = await User.findById(userId).select('+password +passwordHistory');

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      throw new Error('Current password is incorrect');
    }

    // Check password reuse
    const isReused = await user.isPasswordReused(newPassword);
    if (isReused) {
      throw new Error('Cannot reuse any of your last 5 passwords');
    }

    // Add current password to history
    await user.addPasswordToHistory(user.password);

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();

    await user.save();

    // Log activity
    if (metadata.ipAddress && metadata.userAgent) {
      await user.logAuthActivity(
        'password_change',
        metadata.ipAddress,
        metadata.userAgent,
        true
      );
    }

    // Send confirmation email
    emailService.sendPasswordChangedEmail(user.email, user.name || user.username)
      .catch(err => console.error('Password changed email failed:', err));

    return true;
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
};

/**
 * Verify password reset token validity
 * @param {string} token - Reset token
 * @returns {object} User email
 */
const verifyResetToken = async (token) => {
  try {
    const user = await User.findByResetToken(token);

    return {
      email: user.email,
      isValid: true
    };
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
};

/**
 * Logout user from current session
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token to invalidate
 * @param {object} metadata - Request metadata
 * @returns {boolean} Success status
 */
const logoutUser = async (userId, refreshToken, metadata = {}) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (refreshToken) {
      await user.removeRefreshToken(refreshToken);
    }

    // Log activity
    if (metadata.ipAddress && metadata.userAgent) {
      await user.logAuthActivity(
        'logout',
        metadata.ipAddress,
        metadata.userAgent,
        true
      );
    }

    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Logout user from all sessions
 * @param {string} userId - User ID
 * @param {object} metadata - Request metadata
 * @returns {boolean} Success status
 */
const logoutAllSessions = async (userId, metadata = {}) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    await user.clearAllRefreshTokens();

    // Log activity
    if (metadata.ipAddress && metadata.userAgent) {
      await user.logAuthActivity(
        'logout_all',
        metadata.ipAddress,
        metadata.userAgent,
        true
      );
    }

    return true;
  } catch (error) {
    console.error('Logout all sessions error:', error);
    throw error;
  }
};

/**
 * Check username availability
 * @param {string} username - Username to check
 * @returns {boolean} Availability status
 */
const isUsernameAvailable = async (username) => {
  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    return !user;
  } catch (error) {
    console.error('Username availability check error:', error);
    throw new Error('Failed to check username availability');
  }
};

/**
 * Check email availability
 * @param {string} email - Email to check
 * @returns {boolean} Availability status
 */
const isEmailAvailable = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    return !user;
  } catch (error) {
    console.error('Email availability check error:', error);
    throw new Error('Failed to check email availability');
  }
};

/**
 * Get account status
 * @param {string} emailOrUsername - Email or username
 * @returns {object} Account status
 */
const getAccountStatus = async (emailOrUsername) => {
  try {
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() }
      ]
    });

    if (!user) {
      throw new Error('Account not found');
    }

    return {
      isLocked: user.isLocked,
      isActive: user.isActive,
      lockedUntil: user.accountLockedUntil,
      failedAttempts: user.failedLoginAttempts
    };
  } catch (error) {
    console.error('Get account status error:', error);
    throw error;
  }
};

/**
 * Unlock account
 * @param {string} email - User email
 * @returns {boolean} Success status
 */
const unlockAccount = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return true; // Don't reveal if account exists
    }

    if (!user.isLocked) {
      return true;
    }

    await user.resetFailedAttempts();

    // Send confirmation email
    emailService.sendAccountUnlockedEmail(user.email, user.name || user.username)
      .catch(err => console.error('Account unlocked email failed:', err));

    return true;
  } catch (error) {
    console.error('Unlock account error:', error);
    throw new Error('Failed to unlock account');
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} updates - Profile updates
 * @returns {object} Updated user
 */
const updateUserProfile = async (userId, updates) => {
  try {
    const { name, email, companyName } = updates;

    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (companyName !== undefined) user.companyName = companyName;

    // Handle email change
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        throw new Error('Email already in use');
      }

      const oldEmail = user.email;
      user.email = email.toLowerCase();

      // Send notification to both emails
      emailService.sendEmailChangedNotification(
        oldEmail,
        email,
        user.name || user.username
      ).catch(err => console.error('Email change notification failed:', err));
    }

    await user.save();

    return sanitizeUser(user);
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

/**
 * Deactivate user account
 * @param {string} userId - User ID
 * @param {string} password - User password for verification
 * @returns {boolean} Success status
 */
const deactivateAccount = async (userId, password) => {
  try {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new Error('Incorrect password');
    }

    user.isActive = false;
    await user.clearAllRefreshTokens();
    await user.save();

    // Send confirmation email
    emailService.sendAccountDeactivatedEmail(user.email, user.name || user.username)
      .catch(err => console.error('Deactivation email failed:', err));

    return true;
  } catch (error) {
    console.error('Deactivate account error:', error);
    throw error;
  }
};

/**
 * Reactivate user account
 * @param {string} emailOrUsername - Email or username
 * @param {string} password - Password
 * @param {object} metadata - Request metadata
 * @returns {object} User and tokens
 */
const reactivateAccount = async (emailOrUsername, password, metadata = {}) => {
  try {
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() }
      ]
    }).select('+password');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.isActive) {
      throw new Error('Account is already active');
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new Error('Invalid credentials');
    }

    user.isActive = true;
    await user.save();

    // Generate tokens
    const tokens = generateTokenPair(user._id);
    await user.addRefreshToken(tokens.refreshToken);

    // Send confirmation email
    emailService.sendAccountReactivatedEmail(user.email, user.name || user.username)
      .catch(err => console.error('Reactivation email failed:', err));

    return {
      user: sanitizeUser(user),
      tokens
    };
  } catch (error) {
    console.error('Reactivate account error:', error);
    throw error;
  }
};

/**
 * Get user's authentication activity logs
 * @param {string} userId - User ID
 * @param {number} limit - Number of logs to return
 * @returns {Array} Activity logs
 */
const getAuthActivityLogs = async (userId, limit = 50) => {
  try {
    const user = await User.findById(userId).select('authenticationLogs');

    if (!user) {
      throw new Error('User not found');
    }

    return user.authenticationLogs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (error) {
    console.error('Get activity logs error:', error);
    throw error;
  }
};

/**
 * Get user's active sessions
 * @param {string} userId - User ID
 * @returns {Array} Active sessions
 */
const getActiveSessions = async (userId) => {
  try {
    const user = await User.findById(userId).select('refreshTokens');

    if (!user) {
      throw new Error('User not found');
    }

    return user.refreshTokens.map(rt => ({
      id: rt._id,
      createdAt: rt.createdAt,
      expiresAt: new Date(rt.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    }));
  } catch (error) {
    console.error('Get active sessions error:', error);
    throw error;
  }
};

/**
 * Revoke specific session
 * @param {string} userId - User ID
 * @param {string} tokenId - Token ID to revoke
 * @returns {boolean} Success status
 */
const revokeSession = async (userId, tokenId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const initialCount = user.refreshTokens.length;
    user.refreshTokens = user.refreshTokens.filter(
      rt => rt._id.toString() !== tokenId
    );

    if (user.refreshTokens.length === initialCount) {
      throw new Error('Session not found');
    }

    await user.save();

    return true;
  } catch (error) {
    console.error('Revoke session error:', error);
    throw error;
  }
};

/**
 * Sanitize user object (remove sensitive data)
 * @param {object} user - User object
 * @returns {object} Sanitized user
 */
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;

  return {
    id: userObj._id,
    username: userObj.username,
    email: userObj.email,
    name: userObj.name,
    companyName: userObj.companyName,
    role: userObj.role,
    isActive: userObj.isActive,
    lastLogin: userObj.lastLogin,
    createdAt: userObj.createdAt,
    updatedAt: userObj.updatedAt
  };
};

/**
 * Validate session
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token
 * @returns {boolean} Validity status
 */
const validateSession = async (userId, refreshToken) => {
  try {
    const user = await User.findById(userId);

    if (!user || !user.isActive || user.isLocked) {
      return false;
    }

    return user.refreshTokens.some(rt => rt.token === refreshToken);
  } catch (error) {
    console.error('Validate session error:', error);
    return false;
  }
};

module.exports = {
  // Token operations
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyJwtToken,
  decodeToken,
  generateSecureToken,
  hashToken,

  // Password operations
  validatePasswordStrength,
  calculatePasswordStrength,

  // Authentication operations
  registerUser,
  authenticateUser,
  refreshAccessToken,
  logoutUser,
  logoutAllSessions,

  // Password management
  initiatePasswordReset,
  resetPassword,
  changePassword,
  verifyResetToken,

  // Account operations
  isUsernameAvailable,
  isEmailAvailable,
  getAccountStatus,
  unlockAccount,
  updateUserProfile,
  deactivateAccount,
  reactivateAccount,

  // Session management
  getAuthActivityLogs,
  getActiveSessions,
  revokeSession,
  validateSession,

  // Utilities
  sanitizeUser
};