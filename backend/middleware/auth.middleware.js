const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Extract token from request headers
 */
const extractToken = (req) => {
  let token = null;

  // Check Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check cookies (alternative method)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  return token;
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Main authentication middleware
 * Protects routes by verifying JWT token
 */
const authenticate = async (req, res, next) => {
  console.log("\n🔐 === AUTH MIDDLEWARE START ===");
  console.log("📍 Request URL:", req.url);
  console.log("📍 Request Method:", req.method);
  console.log("🔑 Authorization Header:", req.headers.authorization ? "Present" : "Missing");
  console.log("🍪 Cookies:", req.cookies ? Object.keys(req.cookies) : "No cookies");

  try {
    // Extract token from request
    const token = extractToken(req);
    console.log("🎫 Token extracted:", token ? `${token.substring(0, 20)}...` : "NULL");

    if (!token) {
      console.error("❌ No token found in request");
      console.log("=== AUTH MIDDLEWARE END (No Token) ===\n");
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login to access this resource.'
      });
    }

    // Verify token
    console.log("🔍 Verifying token...");
    const decoded = verifyToken(token);
    console.log("✅ Token decoded:", { userId: decoded.userId, iat: decoded.iat, exp: decoded.exp });

    // Find user by ID from token
    console.log("👤 Looking for user with ID:", decoded.userId);
    const user = await User.findById(decoded.userId).select('-password -passwordHistory');
    console.log("👤 User found:", user ? { _id: user._id, username: user.username, email: user.email } : "NULL");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is invalid.'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account is temporarily locked due to multiple failed login attempts. Please try again later or reset your password.'
      });
    }

    // Check if token was issued before password change
    if (user.passwordChangedAt && decoded.iat) {
      const passwordChangedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      
      if (decoded.iat < passwordChangedTimestamp) {
        return res.status(401).json({
          success: false,
          message: 'Password was recently changed. Please login again.'
        });
      }
    }

    // Attach user to request object
    req.user = user;
    req.token = token;

    console.log("✅ User attached to request");
    console.log("=== AUTH MIDDLEWARE END (Success) ===\n");

    next();
  } catch (error) {
    console.error("\n❌ === AUTH MIDDLEWARE ERROR ===");
    console.error('Authentication error:', error.message);
    console.error('Error stack:', error.stack);
    console.error("=== AUTH MIDDLEWARE ERROR END ===\n");

    if (error.message === 'Token has expired') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid but doesn't fail if no token
 */
const authenticateOptional = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password -passwordHistory');

    if (user && user.isActive && !user.isLocked) {
      req.user = user;
      req.token = token;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Authorization middleware - checks user role
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This resource requires one of the following roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Check if user is account owner
 * Compares req.user.id with req.params.userId or req.params.id
 */
const isAccountOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const targetUserId = req.params.userId || req.params.id;

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: 'User ID parameter is required'
    });
  }

  if (req.user._id.toString() !== targetUserId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own account.'
    });
  }

  next();
};

/**
 * Check if user owns the resource or has editor/owner role
 */
const canModifyResource = (resourceOwnerField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Owners and editors can modify
    if (req.user.role === 'owner' || req.user.role === 'editor') {
      return next();
    }

    // Viewers cannot modify
    if (req.user.role === 'viewer') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this resource.'
      });
    }

    // Check resource ownership
    if (req.body[resourceOwnerField] && req.body[resourceOwnerField] !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this resource.'
      });
    }

    next();
  };
};

/**
 * Rate limiting for authentication routes
 * Tracks attempts by IP address
 */
const authRateLimitStore = new Map();

const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Clean up old entries
    for (const [ip, data] of authRateLimitStore.entries()) {
      if (now - data.firstAttempt > windowMs) {
        authRateLimitStore.delete(ip);
      }
    }

    // Get or create rate limit data for this IP
    let rateLimitData = authRateLimitStore.get(clientIp);

    if (!rateLimitData) {
      rateLimitData = {
        attempts: 0,
        firstAttempt: now
      };
      authRateLimitStore.set(clientIp, rateLimitData);
    }

    // Check if window has expired
    if (now - rateLimitData.firstAttempt > windowMs) {
      rateLimitData.attempts = 0;
      rateLimitData.firstAttempt = now;
    }

    // Increment attempts
    rateLimitData.attempts++;

    // Check if limit exceeded
    if (rateLimitData.attempts > maxAttempts) {
      const retryAfter = Math.ceil((rateLimitData.firstAttempt + windowMs - now) / 1000);
      
      return res.status(429).json({
        success: false,
        message: `Too many authentication attempts. Please try again in ${retryAfter} seconds.`,
        retryAfter
      });
    }

    next();
  };
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);

    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found or has been revoked'
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is temporarily locked'
      });
    }

    req.user = user;
    req.refreshToken = refreshToken;

    next();
  } catch (error) {
    console.error('Refresh token verification error:', error.message);

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

/**
 * Attach request metadata for logging
 */
const attachRequestMetadata = (req, res, next) => {
  req.metadata = {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'Unknown'
  };
  next();
};

/**
 * Check if password reset is required
 */
const checkPasswordResetRequired = async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  // Check if password needs to be reset (e.g., after 90 days)
  const passwordAge = Date.now() - (req.user.passwordChangedAt || req.user.createdAt);
  const maxPasswordAge = 90 * 24 * 60 * 60 * 1000; // 90 days

  if (passwordAge > maxPasswordAge) {
    return res.status(403).json({
      success: false,
      message: 'Password reset required. Your password has expired.',
      code: 'PASSWORD_RESET_REQUIRED'
    });
  }

  next();
};

module.exports = {
  authenticate,
  authenticateOptional,
  authorize,
  isAccountOwner,
  canModifyResource,
  authRateLimit,
  verifyRefreshToken,
  attachRequestMetadata,
  checkPasswordResetRequired,
  extractToken,
  verifyToken
};