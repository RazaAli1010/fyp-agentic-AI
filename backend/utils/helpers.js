const crypto = require("crypto");
const { HTTP_STATUS } = require("./constants.js");

class ApiError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Success response helper
 */
const successResponse = (
  res,
  data,
  message = "Success",
  statusCode = HTTP_STATUS.OK
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Error response helper
 */
const errorResponse = (
  res,
  message,
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: message,
  });
};

/**
 * Generate random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Hash string using SHA256
 */
const hashString = (str) => {
  return crypto.createHash("sha256").update(str).digest("hex");
};

/**
 * Sleep/delay function
 */
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Sanitize object (remove null/undefined values)
 */
const sanitizeObject = (obj) => {
  const sanitized = {};

  Object.keys(obj).forEach((key) => {
    if (obj[key] !== null && obj[key] !== undefined) {
      sanitized[key] = obj[key];
    }
  });

  return sanitized;
};

/**
 * Pick specific fields from object
 */
const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

/**
 * Omit specific fields from object
 */
const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Capitalize first letter
 */
const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format date to readable string
 */
const formatDate = (date, includeTime = false) => {
  const d = new Date(date);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return d.toLocaleDateString("en-US", options);
};

/**
 * Calculate time ago
 */
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);

    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
    }
  }

  return "just now";
};

/**
 * Truncate string
 */
const truncate = (str, length = 100, ending = "...") => {
  if (str.length <= length) return str;
  return str.substring(0, length - ending.length) + ending;
};

/**
 * Generate slug from string
 */
const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Parse query string to object
 */
const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString);
  const result = {};

  for (const [key, value] of params) {
    result[key] = value;
  }

  return result;
};

/**
 * Generate pagination metadata
 */
const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    currentPage: parseInt(page),
    totalPages,
    totalItems: total,
    itemsPerPage: parseInt(limit),
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Generate unique ID
 */
const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate percentage
 */
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Format number with commas
 */
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Convert bytes to human readable format
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Retry function with exponential backoff
 */
const retry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delay * Math.pow(2, i));
    }
  }
};

/**
 * Debounce function
 */
const debounce = (func, wait) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
const throttle = (func, limit) => {
  let inThrottle;

  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Group array by key
 */
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Remove duplicates from array
 */
const unique = (array) => {
  return [...new Set(array)];
};

/**
 * Flatten nested array
 */
const flatten = (array) => {
  return array.reduce((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item);
  }, []);
};

/**
 * Chunk array into smaller arrays
 */
const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

module.exports = {
  ApiError,
  successResponse,
  errorResponse,
  generateRandomString,
  hashString,
  sleep,
  sanitizeObject,
  pick,
  omit,
  deepClone,
  isEmpty,
  capitalize,
  formatDate,
  timeAgo,
  truncate,
  slugify,
  parseQueryString,
  getPaginationMeta,
  isValidEmail,
  isValidUrl,
  generateUniqueId,
  calculatePercentage,
  formatNumber,
  formatBytes,
  retry,
  debounce,
  throttle,
  groupBy,
  unique,
  flatten,
  chunk,
};
