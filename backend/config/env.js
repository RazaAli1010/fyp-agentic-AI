const dotenv = require("dotenv");
const path = require("path");

// Loading environment variables from .env file
dotenv.config({ path: path.join(__dirname, "../.env") });

/**
 * Validating required environment variables
 */
const requiredEnvVars = [
  "NODE_ENV",
  "PORT",
  "MONGODB_URI",
  "JWT_SECRET",
  "CLAUDE_API_KEY",
  "FRONTEND_URL",
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((varName) => console.error(`   - ${varName}`));
    process.exit(1);
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error("❌ JWT_SECRET must be at least 32 characters long for security");
    process.exit(1);
  }

  // Validate NODE_ENV values
  const validEnvs = ['development', 'production', 'test'];
  if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
    console.error(`❌ NODE_ENV must be one of: ${validEnvs.join(', ')}`);
    process.exit(1);
  }
};

// Validating on module load
validateEnv();

/**
 * Safe parsing functions with fallbacks
 */
const safeParseInt = (value, fallback) => {
  const parsed = parseInt(value);
  return isNaN(parsed) ? fallback : parsed;
};

const safeParseFloat = (value, fallback) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Environment Configuration
 */
const config = {
  // Application
  env: process.env.NODE_ENV || "development",
  port: safeParseInt(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX || "/api",

  // URLs
  frontendUrl: process.env.FRONTEND_URL,
  backendUrl:
    process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`,

  // Database
  mongodb: {
    uri: process.env.MONGODB_URI,
    testUri: process.env.MONGODB_TEST_URI,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  // Claude AI
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    sonnetModel:
      process.env.CLAUDE_SONNET_MODEL || "claude-sonnet-4-5-20250929",
    haikuModel: process.env.CLAUDE_HAIKU_MODEL || "claude-haiku-4-5",
    maxTokens: safeParseInt(process.env.CLAUDE_MAX_TOKENS, 4096),
    temperature: safeParseFloat(process.env.CLAUDE_TEMPERATURE, 0.7),
  },

  // Email
  email: {
    host: process.env.EMAIL_HOST,
    port: safeParseInt(process.env.EMAIL_PORT, 587),
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
    fromName: process.env.EMAIL_FROM_NAME,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: safeParseInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    maxRequests: safeParseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  },

  // File Upload
  upload: {
    maxSize: safeParseInt(process.env.MAX_FILE_SIZE, 10 * 1024 * 1024), // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || "pdf,doc,docx,txt")
      .split(",")
      .map(type => type.trim()),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim())
      : ["http://localhost:3000"],
    credentials: true,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    enableConsole: process.env.LOG_CONSOLE !== "false",
  },
};

/**
 * Checking if running in production
 */
const isProduction = () => config.env === "production";

/**
 * Checking if running in development
 */
const isDevelopment = () => config.env === "development";

/**
 * Checking if running in test
 */
const isTest = () => config.env === "test";

/**
 * Getting configuration value safely
 */
const getConfig = (key) => {
  const keys = key.split(".");
  let value = config;

  for (const k of keys) {
    value = value[k];
    if (value === undefined) return null;
  }

  return value;
};

module.exports = {
  config,
  isProduction,
  isDevelopment,
  isTest,
  getConfig,
  validateEnv,
};
