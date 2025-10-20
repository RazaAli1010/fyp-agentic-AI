const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/email.service');

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { username, email, password, name, companyName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }
      if (existingUser.username === username.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'This username is already taken'
        });
      }
    }

    // Create new user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      name,
      companyName
    });

    await user.save();

    // Log registration activity
    await user.logAuthActivity(
      'registration',
      req.metadata.ipAddress,
      req.metadata.userAgent,
      true
    );

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token
    await user.addRefreshToken(refreshToken);

    // Send welcome email (async, don't wait)
    emailService.sendWelcomeEmail(user.email, user.name || user.username).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          companyName: user.companyName,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation failed'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Find user by credentials
    const user = await User.findByCredentials(emailOrUsername, password);

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token
    await user.addRefreshToken(refreshToken);

    // Update last login
    await user.updateLastLogin();

    // Log successful login
    await user.logAuthActivity(
      'login',
      req.metadata.ipAddress,
      req.metadata.userAgent,
      true
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          companyName: user.companyName,
          role: user.role,
          lastLogin: user.lastLogin
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);

    // Log failed login attempt if we can identify the user
    const emailOrUsername = req.body.emailOrUsername;
    if (emailOrUsername) {
      const user = await User.findOne({
        $or: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername.toLowerCase() }
        ]
      });

      if (user) {
        await user.logAuthActivity(
          'failed_login',
          req.metadata.ipAddress,
          req.metadata.userAgent,
          false
        );
      }
    }

    res.status(401).json({
      success: false,
      message: error.message || 'Invalid credentials'
    });
  }
};

/**
 * @desc    Logout user (invalidate current refresh token)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await req.user.removeRefreshToken(refreshToken);
    }

    // Log logout activity
    await req.user.logAuthActivity(
      'logout',
      req.metadata.ipAddress,
      req.metadata.userAgent,
      true
    );

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

/**
 * @desc    Logout from all devices
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
const logoutAll = async (req, res) => {
  try {
    await req.user.clearAllRefreshTokens();

    // Log logout activity
    await req.user.logAuthActivity(
      'logout_all',
      req.metadata.ipAddress,
      req.metadata.userAgent,
      true
    );

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout from all devices failed'
    });
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public (requires valid refresh token)
 */
const refreshToken = async (req, res) => {
  try {
    const user = req.user;
    const oldRefreshToken = req.refreshToken;

    // Generate new tokens
    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Remove old refresh token and add new one
    await user.removeRefreshToken(oldRefreshToken);
    await user.addRefreshToken(newRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};

/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      // Send password reset email
      await emailService.sendPasswordResetEmail(
        user.email,
        user.name || user.username,
        resetUrl
      );

      // Log password reset request
      await user.logAuthActivity(
        'password_reset_request',
        req.metadata.ipAddress,
        req.metadata.userAgent,
        true
      );

      res.status(200).json({
        success: true,
        message: 'Password reset link has been sent to your email'
      });
    } catch (emailError) {
      // Clear reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Email send error:', emailError);
      
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed'
    });
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Find user by reset token
    const user = await User.findByResetToken(token);

    // Check if new password was used recently
    const isReused = await user.isPasswordReused(password);
    if (isReused) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reuse any of your last 5 passwords'
      });
    }

    // Add current password to history before changing
    await user.addPasswordToHistory(user.password);

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();

    // Clear all refresh tokens (logout from all devices)
    await user.clearAllRefreshTokens();

    await user.save();

    // Log password reset
    await user.logAuthActivity(
      'password_reset',
      req.metadata.ipAddress,
      req.metadata.userAgent,
      true
    );

    // Send confirmation email
    emailService.sendPasswordChangedEmail(
      user.email,
      user.name || user.username
    ).catch(err => console.error('Failed to send confirmation email:', err));

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Password reset failed'
    });
  }
};

/**
 * @desc    Change password for logged-in user
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password +passwordHistory');

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password was used recently
    const isReused = await user.isPasswordReused(newPassword);
    if (isReused) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reuse any of your last 5 passwords'
      });
    }

    // Add current password to history
    await user.addPasswordToHistory(user.password);

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();

    // Clear all refresh tokens except current session
    const currentRefreshToken = req.body.refreshToken;
    if (currentRefreshToken) {
      user.refreshTokens = user.refreshTokens.filter(rt => rt.token === currentRefreshToken);
    } else {
      await user.clearAllRefreshTokens();
    }

    await user.save();

    // Log password change
    await user.logAuthActivity(
      'password_change',
      req.metadata.ipAddress,
      req.metadata.userAgent,
      true
    );

    // Send confirmation email
    emailService.sendPasswordChangedEmail(
      user.email,
      user.name || user.username
    ).catch(err => console.error('Failed to send confirmation email:', err));

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed'
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          companyName: user.companyName,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name, email, companyName } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (companyName !== undefined) updates.companyName = companyName;

    // Check if email is being changed
    if (email && email.toLowerCase() !== req.user.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'This email is already associated with another account'
        });
      }

      updates.email = email.toLowerCase();

      // Send email notification about email change
      emailService.sendEmailChangedNotification(
        req.user.email,
        email,
        req.user.name || req.user.username
      ).catch(err => console.error('Failed to send email notification:', err));
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          companyName: user.companyName,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation failed'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Profile update failed'
    });
  }
};

/**
 * @desc    Verify if token is valid
 * @route   GET /api/auth/verify-token
 * @access  Private
 */
const verifyToken = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      userId: req.user._id,
      username: req.user.username,
      email: req.user.email
    }
  });
};

/**
 * @desc    Get user's authentication activity logs
 * @route   GET /api/auth/activity-logs
 * @access  Private
 */
const getActivityLogs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('authenticationLogs');

    const logs = user.authenticationLogs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50); // Return last 50 logs

    res.status(200).json({
      success: true,
      data: {
        logs,
        count: logs.length
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs'
    });
  }
};

/**
 * @desc    Get all active sessions
 * @route   GET /api/auth/active-sessions
 * @access  Private
 */
const getActiveSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('refreshTokens');

    const sessions = user.refreshTokens.map(rt => ({
      id: rt._id,
      createdAt: rt.createdAt,
      expiresAt: new Date(rt.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }));

    res.status(200).json({
      success: true,
      data: {
        sessions,
        count: sessions.length
      }
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active sessions'
    });
  }
};

/**
 * @desc    Revoke a specific session
 * @route   DELETE /api/auth/sessions/:tokenId
 * @access  Private
 */
const revokeSession = async (req, res) => {
  try {
    const { tokenId } = req.params;

    const user = await User.findById(req.user._id);
    
    const initialCount = user.refreshTokens.length;
    user.refreshTokens = user.refreshTokens.filter(
      rt => rt._id.toString() !== tokenId
    );

    if (user.refreshTokens.length === initialCount) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke session'
    });
  }
};

/**
 * @desc    Check username availability
 * @route   POST /api/auth/check-username
 * @access  Public
 */
const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    const user = await User.findOne({ username: username.toLowerCase() });

    res.status(200).json({
      success: true,
      data: {
        available: !user,
        username: username.toLowerCase()
      }
    });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check username availability'
    });
  }
};

/**
 * @desc    Check email availability
 * @route   POST /api/auth/check-email
 * @access  Public
 */
const checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    res.status(200).json({
      success: true,
      data: {
        available: !user,
        email: email.toLowerCase()
      }
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email availability'
    });
  }
};

/**
 * @desc    Check account status
 * @route   GET /api/auth/account-status
 * @access  Public
 */
const checkAccountStatus = async (req, res) => {
  try {
    const { email, username } = req.query;

    if (!email && !username) {
      return res.status(400).json({
        success: false,
        message: 'Email or username is required'
      });
    }

    const query = {};
    if (email) query.email = email.toLowerCase();
    if (username) query.username = username.toLowerCase();

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        isLocked: user.isLocked,
        isActive: user.isActive,
        lockedUntil: user.accountLockedUntil,
        failedAttempts: user.failedLoginAttempts
      }
    });
  } catch (error) {
    console.error('Check account status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check account status'
    });
  }
};

/**
 * @desc    Request account unlock
 * @route   POST /api/auth/unlock-account
 * @access  Public
 */
const requestAccountUnlock = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't reveal if account exists
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If your account is locked, an unlock link has been sent to your email'
      });
    }

    if (!user.isLocked) {
      return res.status(200).json({
        success: true,
        message: 'Your account is not locked'
      });
    }

    // Reset failed attempts and unlock
    await user.resetFailedAttempts();

    // Send email notification
    emailService.sendAccountUnlockedEmail(
      user.email,
      user.name || user.username
    ).catch(err => console.error('Failed to send unlock email:', err));

    res.status(200).json({
      success: true,
      message: 'Your account has been unlocked successfully'
    });
  } catch (error) {
    console.error('Unlock account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock account'
    });
  }
};

/**
 * @desc    Verify password reset token
 * @route   POST /api/auth/verify-reset-token/:token
 * @access  Public
 */
const verifyPasswordResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findByResetToken(token);

    res.status(200).json({
      success: true,
      message: 'Reset token is valid',
      data: {
        email: user.email
      }
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Invalid or expired reset token'
    });
  }
};

/**
 * @desc    Deactivate user account
 * @route   DELETE /api/auth/account
 * @access  Private
 */
const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to deactivate account'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Deactivate account
    user.isActive = false;
    await user.clearAllRefreshTokens();
    await user.save();

    // Send confirmation email
    emailService.sendAccountDeactivatedEmail(
      user.email,
      user.name || user.username
    ).catch(err => console.error('Failed to send deactivation email:', err));

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account'
    });
  }
};

/**
 * @desc    Reactivate deactivated account
 * @route   POST /api/auth/reactivate-account
 * @access  Public
 */
const reactivateAccount = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Find user (including inactive ones)
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account is already active'
      });
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reactivate account
    user.isActive = true;
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await user.addRefreshToken(refreshToken);

    // Send confirmation email
    emailService.sendAccountReactivatedEmail(
      user.email,
      user.name || user.username
    ).catch(err => console.error('Failed to send reactivation email:', err));

    res.status(200).json({
      success: true,
      message: 'Account reactivated successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          companyName: user.companyName,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Reactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate account'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  logoutAll,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
  updateProfile,
  verifyToken,
  getActivityLogs,
  getActiveSessions,
  revokeSession,
  checkUsernameAvailability,
  checkEmailAvailability,
  checkAccountStatus,
  requestAccountUnlock,
  verifyPasswordResetToken,
  deactivateAccount,
  reactivateAccount
};