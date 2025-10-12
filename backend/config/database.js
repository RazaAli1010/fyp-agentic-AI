const mongoose = require("mongoose");

/**
 * MongoDB Connection Configuration
 */
const connectDatabase = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
      w: "majority",
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(` MongoDB Connected: ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);

    // Handling connection events
    mongoose.connection.on("connected", () => {
      console.log(" Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error(" Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("  Mongoose disconnected from MongoDB");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log(" MongoDB connection closed due to app termination");
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error(" MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

/**
 * Checking database connection status
 */
const checkDatabaseConnection = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return {
    status: states[state],
    isConnected: state === 1,
  };
};

/**
 * Getting database statistics
 */
const getDatabaseStats = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database not connected");
    }

    const stats = await mongoose.connection.db.stats();
    return {
      database: mongoose.connection.name,
      collections: stats.collections,
      dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
      indexes: stats.indexes,
      indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`,
    };
  } catch (error) {
    console.error("Error fetching database stats:", error);
    throw error;
  }
};

module.exports = {
  connectDatabase,
  checkDatabaseConnection,
  getDatabaseStats,
};
