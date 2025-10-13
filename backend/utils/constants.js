const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * API Response Messages
 */
const MESSAGES = {
  // Success messages
  SUCCESS: "Operation completed successfully",
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",

  // Auth messages
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  REGISTER_SUCCESS: "Registration successful",
  PASSWORD_RESET_SENT: "Password reset link sent to your email",
  PASSWORD_CHANGED: "Password changed successfully",

  // Error messages
  INTERNAL_ERROR: "Internal server error",
  INVALID_CREDENTIALS: "Invalid credentials",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "You do not have permission to access this resource",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Validation error",
  DUPLICATE_ENTRY: "Resource already exists",

  // Chat messages
  MESSAGE_SENT: "Message sent successfully",
  CHAT_DELETED: "Chat deleted successfully",
  CONVERSATION_ARCHIVED: "Conversation archived successfully",

  // Rate limit
  RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later.",
};

/**
 * User Roles
 */
const USER_ROLES = {
  OWNER: "owner",
  EDITOR: "editor",
  VIEWER: "viewer",
};

/**
 * Project Stages
 */
const PROJECT_STAGES = {
  IDEA: "idea",
  VALIDATION: "validation",
  MVP: "mvp",
  GROWTH: "growth",
  SCALE: "scale",
};

/**
 * Conversation Types
 */
const CONVERSATION_TYPES = {
  GENERAL: "general",
  INVESTOR_OBJECTION: "investor_objection",
  STRATEGY: "strategy",
  TECHNICAL: "technical",
};

/**
 * Common Investor Objections
 */
const INVESTOR_OBJECTIONS = [
  "Market is too saturated",
  "Team lacks relevant experience",
  "Unclear monetization strategy",
  "Scaling challenges",
  "Strong competitive threats",
  "Market timing concerns",
  "High customer acquisition costs",
  "Long sales cycles",
  "Technology risks",
  "Regulatory challenges",
];

/**
 * Smart Prompt Suggestions by Category
 */
const SMART_SUGGESTIONS = {
  STRATEGY: [
    "What should my go-to-market strategy be?",
    "How can I differentiate from competitors?",
    "What metrics should I track?",
    "How do I price my product?",
    "What are potential pivot opportunities?",
  ],
  FUNDRAISING: [
    "How much should I raise in my seed round?",
    "What should my valuation be?",
    "How do I find the right investors?",
    "What should I include in my pitch deck?",
    "How do I structure my cap table?",
  ],
  GROWTH: [
    "How do I acquire my first 100 customers?",
    "What growth channels should I focus on?",
    "How do I improve customer retention?",
    "What are effective viral growth strategies?",
    "How do I scale my sales team?",
  ],
  PRODUCT: [
    "How do I validate product-market fit?",
    "What features should I prioritize?",
    "How do I gather user feedback effectively?",
    "What should my MVP include?",
    "How do I reduce churn?",
  ],
};

/**
 * Token limits
 */
const TOKEN_LIMITS = {
  MAX_CONTEXT: 200000, // Claude's context window
  MAX_OUTPUT: 4096,
  RESERVED_FOR_RESPONSE: 4096,
  MAX_CONVERSATION_CONTEXT: 10000,
};

/**
 * Rate limits
 */
const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  CHAT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 20,
  },
};

/**
 * Cache durations (in seconds)
 */
const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

/**
 * File upload limits
 */
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ["pdf", "doc", "docx", "txt", "csv", "xlsx"],
  MAX_FILES: 5,
};

/**
 * Pagination defaults
 */
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

/**
 * Email templates
 */
const EMAIL_TYPES = {
  WELCOME: "welcome",
  PASSWORD_RESET: "password_reset",
  PASSWORD_CHANGED: "password_changed",
  EMAIL_CHANGED: "email_changed",
  ACCOUNT_LOCKED: "account_locked",
  ACCOUNT_UNLOCKED: "account_unlocked",
  ACCOUNT_DEACTIVATED: "account_deactivated",
  ACCOUNT_REACTIVATED: "account_reactivated",
};

/**
 * Default response format
 */
const RESPONSE_FORMAT = {
  success: true,
  message: "",
  data: null,
  error: null,
};

/**
 * MongoDB collection names
 */
const COLLECTIONS = {
  USERS: "users",
  PROJECTS: "projects",
  CHAT_HISTORY: "chathistories",
  PROJECT_VERSIONS: "projectversions",
};

/**
 * Environment types
 */
const ENVIRONMENTS = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  TEST: "test",
  STAGING: "staging",
};

/**
 * Logging levels
 */
const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
};

module.exports = {
  HTTP_STATUS,
  MESSAGES,
  USER_ROLES,
  PROJECT_STAGES,
  CONVERSATION_TYPES,
  INVESTOR_OBJECTIONS,
  SMART_SUGGESTIONS,
  TOKEN_LIMITS,
  RATE_LIMITS,
  CACHE_DURATIONS,
  UPLOAD_LIMITS,
  PAGINATION,
  EMAIL_TYPES,
  RESPONSE_FORMAT,
  COLLECTIONS,
  ENVIRONMENTS,
  LOG_LEVELS,
};
