const isValidObjectId = (id) => {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
};

const isValidEmail = (email) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordPattern.test(password);
};

const isValidUsername = (username) => {
  // 3-30 characters, alphanumeric and underscore only
  const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;
  return usernamePattern.test(username);
};

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidPhone = (phone) => {
  const phonePattern = /^[\d\s\-\+\(\)]+$/;
  return phonePattern.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

const isValidDate = (dateString) => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

const isValidLength = (str, min, max) => {
  const length = str.length;
  return length >= min && length <= max;
};

const isInRange = (num, min, max) => {
  return num >= min && num <= max;
};

const isNonEmptyArray = (arr) => {
  return Array.isArray(arr) && arr.length > 0;
};

const isNonEmptyObject = (obj) => {
  return obj && typeof obj === "object" && Object.keys(obj).length > 0;
};

const sanitizeHtml = (str) => {
  return str.replace(/<[^>]*>?/gm, "");
};

const isAllowedFileType = (filename, allowedTypes) => {
  const extension = filename.split(".").pop().toLowerCase();
  return allowedTypes.includes(extension);
};

const isValidFileSize = (fileSize, maxSize) => {
  return fileSize <= maxSize;
};

const isValidJson = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

const isPositiveNumber = (num) => {
  return typeof num === "number" && num > 0;
};

const isInteger = (num) => {
  return Number.isInteger(num);
};

const isAlphanumeric = (str) => {
  return /^[a-zA-Z0-9]+$/.test(str);
};

const isEmptyOrWhitespace = (str) => {
  return !str || str.trim().length === 0;
};

module.exports = {
  isValidObjectId,
  isValidEmail,
  isStrongPassword,
  isValidUsername,
  isValidUrl,
  isValidPhone,
  isValidDate,
  isValidLength,
  isInRange,
  isNonEmptyArray,
  isNonEmptyObject,
  sanitizeHtml,
  isAllowedFileType,
  isValidFileSize,
  isValidJson,
  isPositiveNumber,
  isInteger,
  isAlphanumeric,
  isEmptyOrWhitespace,
};
