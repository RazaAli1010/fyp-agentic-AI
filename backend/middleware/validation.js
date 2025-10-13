const { body, param, query, validationResult } = require("express-validator");
const { ApiError } = require("./errorHandler.js");

/**
 * Validate request and return errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    throw new ApiError(errorMessages[0], 400);
  }

  next();
};

/**
 * Common validation rules
 */
const commonRules = {
  email: body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  password: body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  username: body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  mongoId: (field) => param(field).isMongoId().withMessage(`Invalid ${field}`),
};

/**
 * Authentication validations
 */
const validateRegistration = [
  commonRules.username,
  commonRules.email,
  commonRules.password,
  body("name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("companyName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Company name cannot exceed 100 characters"),
  validate,
];

const validateLogin = [
  body("emailOrUsername")
    .trim()
    .notEmpty()
    .withMessage("Email or username is required"),
  body("password").trim().notEmpty().withMessage("Password is required"),
  validate,
];

const validatePasswordReset = [
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Please confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  validate,
];

const validatePasswordChange = [
  body("currentPassword")
    .trim()
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .trim()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Please confirm your new password")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  validate,
];

const validateProfileUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("companyName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Company name cannot exceed 100 characters"),
  validate,
];

const validateEmail = [commonRules.email, validate];

/**
 * Chat validations
 */
const validateChatMessage = [
  body("projectId")
    .notEmpty()
    .withMessage("Project ID is required")
    .isMongoId()
    .withMessage("Invalid project ID"),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 1, max: 5000 })
    .withMessage("Message must be between 1 and 5000 characters"),
  body("conversationType")
    .optional()
    .isIn(["general", "investor_objection", "strategy", "technical"])
    .withMessage("Invalid conversation type"),
  body("chatId").optional().isMongoId().withMessage("Invalid chat ID"),
  validate,
];

const validateInvestorObjection = [
  body("projectId")
    .notEmpty()
    .withMessage("Project ID is required")
    .isMongoId()
    .withMessage("Invalid project ID"),
  body("objection")
    .if(body("customObjection").not().exists())
    .notEmpty()
    .withMessage("Objection is required"),
  body("customObjection")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Custom objection must be between 10 and 1000 characters"),
  validate,
];

/**
 * Project validations
 */
const validateProject = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Project name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Project name must be between 3 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),
  body("industry")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Industry cannot exceed 100 characters"),
  body("stage")
    .optional()
    .trim()
    .isIn(["idea", "validation", "mvp", "growth", "scale"])
    .withMessage("Invalid project stage"),
  validate,
];

const validateProjectUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Project name must be between 3 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),
  body("industry")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Industry cannot exceed 100 characters"),
  body("stage")
    .optional()
    .trim()
    .isIn(["idea", "validation", "mvp", "growth", "scale"])
    .withMessage("Invalid project stage"),
  validate,
];

/**
 * Query parameter validations
 */
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  validate,
];

const validateSearch = [
  query("query")
    .trim()
    .notEmpty()
    .withMessage("Search query is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Search query must be between 1 and 200 characters"),
  validate,
];

/**
 * Rating validation
 */
const validateRating = [
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("feedback")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Feedback cannot exceed 500 characters"),
  validate,
];

module.exports = {
  validate,
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validatePasswordChange,
  validateProfileUpdate,
  validateEmail,
  validateChatMessage,
  validateInvestorObjection,
  validateProject,
  validateProjectUpdate,
  validatePagination,
  validateSearch,
  validateRating,
};
