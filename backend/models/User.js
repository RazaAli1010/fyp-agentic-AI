const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ]
    },
    
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false
    },
    
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    
    companyName: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    
    passwordHistory: [{
      type: String,
      select: false
    }],
    
    passwordResetToken: {
      type: String,
      select: false
    },
    
    passwordResetExpires: {
      type: Date,
      select: false
    },
    
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    
    accountLockedUntil: {
      type: Date
    },
    
    isActive: {
      type: Boolean,
      default: true
    },
    
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'owner'
    },
    
    lastLogin: {
      type: Date
    },
    
    authenticationLogs: [{
      action: {
        type: String,
        enum: ['login', 'logout', 'failed_login', 'password_reset', 'password_change'],
        required: true
      },
      ipAddress: String,
      userAgent: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      success: Boolean
    }],
    
    refreshTokens: [{
      token: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800 // 7 days in seconds
      }
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ accountLockedUntil: 1 });

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to check if password was used recently
userSchema.methods.isPasswordReused = async function(newPassword) {
  if (!this.passwordHistory || this.passwordHistory.length === 0) {
    return false;
  }

  // Check against last 5 passwords
  const recentPasswords = this.passwordHistory.slice(-5);
  
  for (const oldPassword of recentPasswords) {
    const isMatch = await bcrypt.compare(newPassword, oldPassword);
    if (isMatch) {
      return true;
    }
  }
  
  return false;
};

// Method to add password to history
userSchema.methods.addPasswordToHistory = async function(password) {
  if (!this.passwordHistory) {
    this.passwordHistory = [];
  }
  
  // Keep only last 5 passwords
  if (this.passwordHistory.length >= 5) {
    this.passwordHistory.shift();
  }
  
  this.passwordHistory.push(password);
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token before storing
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expiration to 30 minutes
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000;
  
  return resetToken;
};

// Method to increment failed login attempts
userSchema.methods.incrementFailedAttempts = async function() {
  // If account is already locked and lock period has expired, reset
  if (this.accountLockedUntil && this.accountLockedUntil < Date.now()) {
    return await this.constructor.findByIdAndUpdate(
      this._id,
      {
        $set: { failedLoginAttempts: 1 },
        $unset: { accountLockedUntil: 1 }
      },
      { new: true }
    );
  }

  // Increment failed attempts
  const updates = { $inc: { failedLoginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { accountLockedUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }

  return await this.constructor.findByIdAndUpdate(this._id, updates, { new: true });
};

// Method to reset failed login attempts
userSchema.methods.resetFailedAttempts = async function() {
  return await this.constructor.findByIdAndUpdate(
    this._id,
    {
      $set: { failedLoginAttempts: 0 },
      $unset: { accountLockedUntil: 1 }
    },
    { new: true }
  );
};

// Method to log authentication activity
userSchema.methods.logAuthActivity = async function(action, ipAddress, userAgent, success = true) {
  this.authenticationLogs.push({
    action,
    ipAddress,
    userAgent,
    success,
    timestamp: new Date()
  });

  // Keep only last 100 logs to prevent document from growing too large
  if (this.authenticationLogs.length > 100) {
    this.authenticationLogs = this.authenticationLogs.slice(-100);
  }

  await this.save();
};

// Method to update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save();
};

// Method to add refresh token
userSchema.methods.addRefreshToken = async function(token) {
  this.refreshTokens.push({ token });
  
  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  
  await this.save();
};

// Method to remove refresh token
userSchema.methods.removeRefreshToken = async function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  await this.save();
};

// Method to clear all refresh tokens (logout from all devices)
userSchema.methods.clearAllRefreshTokens = async function() {
  this.refreshTokens = [];
  await this.save();
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function(emailOrUsername, password) {
  const user = await this.findOne({
    $or: [
      { email: emailOrUsername.toLowerCase() },
      { username: emailOrUsername.toLowerCase() }
    ]
  }).select('+password +passwordHistory');

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if account is locked
  if (user.isLocked) {
    throw new Error('Account is temporarily locked due to too many failed login attempts. Please try again later or reset your password.');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new Error('Account has been deactivated');
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    await user.incrementFailedAttempts();
    throw new Error('Invalid credentials');
  }

  // Reset failed attempts on successful login
  if (user.failedLoginAttempts > 0) {
    await user.resetFailedAttempts();
  }

  return user;
};

// Static method to find by password reset token
userSchema.statics.findByResetToken = async function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+passwordResetToken +passwordResetExpires +passwordHistory');

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  return user;
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  
  delete user.password;
  delete user.passwordHistory;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.refreshTokens;
  delete user.authenticationLogs;
  delete user.__v;
  
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;