const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    model: String,
    tokensUsed: {
      input: Number,
      output: Number,
      total: Number,
    },
    complexity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
    },
    responseTime: Number,
    cached: {
      type: Boolean,
      default: false,
    },
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  feedback: String,
  isPinned: {
    type: Boolean,
    default: false,
  },
  isStarred: {
    type: Boolean,
    default: false,
  },
});

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    messages: [messageSchema],
    conversationType: {
      type: String,
      enum: ["general", "investor_objection", "strategy", "technical"],
      default: "general",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    summary: {
      type: String,
      maxlength: 1000,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    actionItems: [
      {
        text: String,
        completed: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalTokensUsed: {
      type: Number,
      default: 0,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
chatHistorySchema.index({ userId: 1, projectId: 1, createdAt: -1 });
chatHistorySchema.index({ userId: 1, isActive: 1 });
chatHistorySchema.index({ "messages.isPinned": 1 });
chatHistorySchema.index({ tags: 1 });
chatHistorySchema.index({ lastMessageAt: -1 });

// Virtual for getting only user messages
chatHistorySchema.virtual("userMessages").get(function () {
  return this.messages.filter((msg) => msg.role === "user");
});

// Virtual for getting only assistant messages
chatHistorySchema.virtual("assistantMessages").get(function () {
  return this.messages.filter((msg) => msg.role === "assistant");
});

// Pre-save middleware to update aggregated fields
chatHistorySchema.pre("save", function (next) {
  // Update message count
  this.messageCount = this.messages.length;

  // Calculate total tokens used
  this.totalTokensUsed = this.messages.reduce((total, msg) => {
    if (msg.metadata && msg.metadata.tokensUsed) {
      return total + (msg.metadata.tokensUsed.total || 0);
    }
    return total;
  }, 0);

  // Update last message timestamp
  if (this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
  }

  // Auto-generate title from first user message if not set
  if (!this.title && this.messages.length > 0) {
    const firstUserMessage = this.messages.find((msg) => msg.role === "user");
    if (firstUserMessage) {
      this.title =
        firstUserMessage.content.substring(0, 50) +
        (firstUserMessage.content.length > 50 ? "..." : "");
    }
  }

  next();
});

// Instance method to add message
chatHistorySchema.methods.addMessage = function (role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    timestamp: new Date(),
    metadata,
  });
  return this.save();
};

// Instance method to pin message
chatHistorySchema.methods.pinMessage = async function (messageId) {
  const message = this.messages.id(messageId);
  if (message) {
    message.isPinned = !message.isPinned;
    await this.save();
    return message;
  }
  throw new Error("Message not found");
};

// Instance method to star message
chatHistorySchema.methods.starMessage = async function (messageId) {
  const message = this.messages.id(messageId);
  if (message) {
    message.isStarred = !message.isStarred;
    await this.save();
    return message;
  }
  throw new Error("Message not found");
};

// Instance method to rate message
chatHistorySchema.methods.rateMessage = async function (
  messageId,
  rating,
  feedback
) {
  const message = this.messages.id(messageId);
  if (message) {
    message.rating = rating;
    if (feedback) message.feedback = feedback;
    await this.save();
    return message;
  }
  throw new Error("Message not found");
};

// Instance method to add action item
chatHistorySchema.methods.addActionItem = async function (text) {
  this.actionItems.push({ text });
  await this.save();
  return this.actionItems[this.actionItems.length - 1];
};

// Instance method to toggle action item completion
chatHistorySchema.methods.toggleActionItem = async function (actionItemId) {
  const actionItem = this.actionItems.id(actionItemId);
  if (actionItem) {
    actionItem.completed = !actionItem.completed;
    await this.save();
    return actionItem;
  }
  throw new Error("Action item not found");
};

// Instance method to generate summary
chatHistorySchema.methods.generateSummary = function () {
  const userMessages = this.messages.filter((msg) => msg.role === "user");
  const topics = userMessages
    .map((msg) => msg.content.substring(0, 100))
    .join("; ");
  this.summary = `Discussed: ${topics}`;
  return this.save();
};

// Static method to get user's chat statistics
chatHistorySchema.statics.getUserChatStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalChats: { $sum: 1 },
        totalMessages: { $sum: "$messageCount" },
        totalTokens: { $sum: "$totalTokensUsed" },
        avgMessagesPerChat: { $avg: "$messageCount" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalChats: 0,
      totalMessages: 0,
      totalTokens: 0,
      avgMessagesPerChat: 0,
    }
  );
};

// Static method to get project chat history
chatHistorySchema.statics.getProjectChats = async function (
  projectId,
  limit = 10
) {
  return this.find({ projectId, isActive: true })
    .sort({ lastMessageAt: -1 })
    .limit(limit)
    .select("title conversationType messageCount lastMessageAt createdAt")
    .lean();
};

// Static method to search in chat history
chatHistorySchema.statics.searchChats = async function (
  userId,
  query,
  limit = 20
) {
  return this.find({
    userId,
    $or: [
      { title: { $regex: query, $options: "i" } },
      { "messages.content": { $regex: query, $options: "i" } },
      { tags: { $regex: query, $options: "i" } },
    ],
  })
    .sort({ lastMessageAt: -1 })
    .limit(limit)
    .select("title conversationType messageCount lastMessageAt")
    .lean();
};

// Clean up old inactive chats (optional retention policy)
chatHistorySchema.statics.cleanupOldChats = async function (daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.deleteMany({
    isActive: false,
    lastMessageAt: { $lt: cutoffDate },
  });

  return result;
};

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

module.exports = ChatHistory;
