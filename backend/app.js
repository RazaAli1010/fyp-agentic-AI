const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { config } = require("./config/env.js");
const { errorHandler, notFound } = require("./middleware/errorHandler.js");

const authRoutes = require("./routes/auth.routes.js");
const chatRoutes = require("./routes/chat.routes.js");
const projectRoutes = require("./routes/project.routes.js");

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(mongoSanitize());

app.use(compression());

if (config.env === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.env === "development" ? 1000 : config.rateLimit.maxRequests,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.env === "development", // Skip rate limiting in development
});

// Only apply rate limiting in production
if (config.env !== "development") {
  app.use("/api", globalLimiter);
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.env === "development" ? 100 : 5,
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true,
  skip: (req) => config.env === "development", // Skip auth rate limiting in development
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

app.use(`${config.apiPrefix}/auth`, authLimiter, authRoutes);
app.use(`${config.apiPrefix}/chat`, chatRoutes);
app.use(`${config.apiPrefix}/projects`, projectRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Startup AI Platform API",
    version: "1.0.0",
    documentation: "/api/docs",
  });
});

app.use(notFound);

app.use(errorHandler);

module.exports = app;
