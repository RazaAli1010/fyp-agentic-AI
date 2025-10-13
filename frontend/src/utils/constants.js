export const APP_NAME = "Startup Advisor AI";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const PROJECT_STAGES = {
  IDEA: "idea",
  VALIDATION: "validation",
  MVP: "mvp",
  GROWTH: "growth",
  SCALE: "scale",
};

export const PROJECT_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
  ARCHIVED: "archived",
};

export const MESSAGE_TYPES = {
  USER: "user",
  AI: "ai",
  SYSTEM: "system",
};

export const CHAT_MODES = {
  GENERAL: "general",
  INVESTOR_OBJECTIONS: "investor_objections",
  BUSINESS_MODEL: "business_model",
  MARKET_ANALYSIS: "market_analysis",
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password/:token",
  DASHBOARD: "/dashboard",
  PROJECTS: "/projects",
  PROJECT_DETAILS: "/projects/:projectId",
  CREATE_PROJECT: "/projects/create",
  EDIT_PROJECT: "/projects/:projectId/edit",
  VERSION_HISTORY: "/projects/:projectId/versions",
  CHAT: "/chat",
  CHAT_WITH_PROJECT: "/chat/:projectId",
  PROFILE: "/profile",
  SETTINGS: "/settings",
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
  THEME: "theme",
};

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  PROJECT_NAME_MIN_LENGTH: 3,
  PROJECT_NAME_MAX_LENGTH: 100,
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const TOAST_DURATION = 3000;

export const DEBOUNCE_DELAY = 500;

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export const INVESTOR_OBJECTION_CATEGORIES = [
  "Market Size",
  "Competition",
  "Team",
  "Traction",
  "Business Model",
  "Technology",
  "Scalability",
  "Funding",
  "Risk",
  "Exit Strategy",
];
