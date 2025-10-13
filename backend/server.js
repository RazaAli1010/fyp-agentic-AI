const app = require("./app.js");
const { connectDatabase } = require("./config/database.js");
const { config, isDevelopment } = require("./config/env.js");
const {
  handleUnhandledRejection,
  handleUncaughtException,
} = require("./middleware/errorHandler.js");
const { verifyConnection } = require("./services/email.service.js");

handleUncaughtException();

const PORT = config.port;
const HOST = process.env.HOST || "0.0.0.0";

const startServer = async () => {
  try {
    // Connect to database
    console.log(" Connecting to MongoDB");
    await connectDatabase();

    verifyConnection().catch((err) => {
      console.warn("  Email service verification failed:", err.message);
    });

    // Start Express server
    const server = app.listen(PORT, HOST, () => {
      console.log(`Server running in ${config.env} mode`);
      console.log(`URL: http://${HOST}:${PORT}`);
      console.log(`API: http://${HOST}:${PORT}${config.apiPrefix}`);

      if (isDevelopment()) {
        console.log(" Development mode enabled");
        console.log(" Logging level: verbose\n");
      }
    });

    handleUnhandledRejection();

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown`);

      server.close(async () => {
        console.log(" HTTP server closed");

        try {
          const mongoose = require("mongoose");
          await mongoose.connection.close();
          console.log(" MongoDB connection closed");
          console.log(" Graceful shutdown completed");
          process.exit(0);
        } catch (error) {
          console.error(" Error during shutdown:", error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error("⚠️  Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    return server;
  } catch (error) {
    console.error(" Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = { startServer };
