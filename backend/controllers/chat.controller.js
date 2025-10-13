const ChatHistory = require("../models/ChatHistory.js");
const Project = require("../models/Project.js");
const claudeService = require("../services/claude.service.js");
const ragService = require("../services/rag.service.js");
const { ApiError } = require("../utils/helpers.js");

const sendMessage = async (req, res, next) => {
  try {
    const {
      projectId,
      message,
      conversationType = "general",
      chatId,
    } = req.body;
    const userId = req.user._id;

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw new ApiError("Project not found", 404);
    }

    let chatHistory;
    if (chatId) {
      chatHistory = await ChatHistory.findOne({ _id: chatId, userId });
      if (!chatHistory) {
        throw new ApiError("Chat conversation not found", 404);
      }
    } else {
      chatHistory = new ChatHistory({
        userId,
        projectId,
        conversationType,
      });
    }

    await chatHistory.addMessage("user", message);

    const projectContext = await ragService.buildProjectContext(project);

    const conversationHistory = chatHistory.messages.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Generate AI response
    const startTime = Date.now();
    const aiResponse = await claudeService.generateResponse(
      message,
      conversationHistory,
      projectContext,
      conversationType
    );
    const responseTime = Date.now() - startTime;

    // Add assistant message with metadata
    await chatHistory.addMessage("assistant", aiResponse.content, {
      model: aiResponse.model,
      tokensUsed: aiResponse.usage,
      complexity: aiResponse.complexity,
      responseTime,
    });

    res.status(200).json({
      success: true,
      data: {
        chatId: chatHistory._id,
        message: aiResponse.content,
        messageId: chatHistory.messages[chatHistory.messages.length - 1]._id,
        metadata: {
          model: aiResponse.model,
          tokensUsed: aiResponse.usage,
          responseTime,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const handleInvestorObjection = async (req, res, next) => {
  try {
    const { projectId, objection, customObjection } = req.body;
    const userId = req.user._id;

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw new ApiError("Project not found", 404);
    }

    // Get or create chat history for investor objections
    let chatHistory = await ChatHistory.findOne({
      userId,
      projectId,
      conversationType: "investor_objection",
      isActive: true,
    });

    if (!chatHistory) {
      chatHistory = new ChatHistory({
        userId,
        projectId,
        conversationType: "investor_objection",
        title: "Investor Objections & Rebuttals",
      });
    }

    const objectionText = customObjection || objection;

    // Add user objection
    await chatHistory.addMessage(
      "user",
      `Investor Objection: ${objectionText}`
    );

    // Get project context
    const projectContext = await ragService.buildProjectContext(project);

    // Generate specialized investor objection response
    const startTime = Date.now();
    const response = await claudeService.handleInvestorObjection(
      objectionText,
      projectContext
    );
    const responseTime = Date.now() - startTime;

    // Add assistant response
    await chatHistory.addMessage("assistant", response.content, {
      model: response.model,
      tokensUsed: response.usage,
      complexity: "HIGH",
      responseTime,
    });

    res.status(200).json({
      success: true,
      data: {
        chatId: chatHistory._id,
        objection: objectionText,
        response: response.parsedResponse,
        messageId: chatHistory.messages[chatHistory.messages.length - 1]._id,
        metadata: {
          model: response.model,
          tokensUsed: response.usage,
          responseTime,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getChatHistory = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const { limit = 10, page = 1 } = req.query;

    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw new ApiError("Project not found", 404);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const chats = await ChatHistory.find({ userId, projectId, isActive: true })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select(
        "title conversationType messageCount lastMessageAt createdAt tags"
      );

    const total = await ChatHistory.countDocuments({
      userId,
      projectId,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: {
        chats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalChats: total,
          hasMore: skip + chats.length < total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getConversation = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await ChatHistory.findOne({ _id: chatId, userId }).populate(
      "projectId",
      "name description"
    );

    if (!chat) {
      throw new ApiError("Conversation not found", 404);
    }

    res.status(200).json({
      success: true,
      data: { conversation: chat },
    });
  } catch (error) {
    next(error);
  }
};

const deleteConversation = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await ChatHistory.findOneAndDelete({ _id: chatId, userId });

    if (!chat) {
      throw new ApiError("Conversation not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const archiveConversation = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await ChatHistory.findOne({ _id: chatId, userId });

    if (!chat) {
      throw new ApiError("Conversation not found", 404);
    }

    chat.isActive = !chat.isActive;
    await chat.save();

    res.status(200).json({
      success: true,
      message: `Conversation ${
        chat.isActive ? "unarchived" : "archived"
      } successfully`,
      data: {
        isActive: chat.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

const pinMessage = async (req, res, next) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user._id;

    const chat = await ChatHistory.findOne({ _id: chatId, userId });

    if (!chat) {
      throw new ApiError("Conversation not found", 404);
    }

    const message = await chat.pinMessage(messageId);

    res.status(200).json({
      success: true,
      message: `Message ${
        message.isPinned ? "pinned" : "unpinned"
      } successfully`,
      data: { isPinned: message.isPinned },
    });
  } catch (error) {
    next(error);
  }
};

const starMessage = async (req, res, next) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user._id;

    const chat = await ChatHistory.findOne({ _id: chatId, userId });

    if (!chat) {
      throw new ApiError("Conversation not found", 404);
    }

    const message = await chat.starMessage(messageId);

    res.status(200).json({
      success: true,
      message: `Message ${
        message.isStarred ? "starred" : "unstarred"
      } successfully`,
      data: { isStarred: message.isStarred },
    });
  } catch (error) {
    next(error);
  }
};

const rateMessage = async (req, res, next) => {
  try {
    const { chatId, messageId } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      throw new ApiError("Rating must be between 1 and 5", 400);
    }

    const chat = await ChatHistory.findOne({ _id: chatId, userId });

    if (!chat) {
      throw new ApiError("Conversation not found", 404);
    }

    await chat.rateMessage(messageId, rating, feedback);

    res.status(200).json({
      success: true,
      message: "Message rated successfully",
    });
  } catch (error) {
    next(error);
  }
};

const searchChats = async (req, res, next) => {
  try {
    const { query, limit = 20 } = req.query;
    const userId = req.user._id;

    if (!query || query.trim().length === 0) {
      throw new ApiError("Search query is required", 400);
    }

    const results = await ChatHistory.searchChats(
      userId,
      query.trim(),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: {
        results,
        count: results.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getChatStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const stats = await ChatHistory.getUserChatStats(userId);

    // Get pinned messages count
    const pinnedCount = await ChatHistory.countDocuments({
      userId,
      "messages.isPinned": true,
    });

    // Get starred messages count
    const starredCount = await ChatHistory.countDocuments({
      userId,
      "messages.isStarred": true,
    });

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        pinnedMessages: pinnedCount,
        starredMessages: starredCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const addActionItem = async (req, res, next) => {
  try {
    const { chatId, text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      throw new ApiError("Action item text is required", 400);
    }

    const chat = await ChatHistory.findOne({ _id: chatId, userId });

    if (!chat) {
      throw new ApiError("Conversation not found", 404);
    }

    const actionItem = await chat.addActionItem(text.trim());

    res.status(201).json({
      success: true,
      message: "Action item added successfully",
      data: { actionItem },
    });
  } catch (error) {
    next(error);
  }
};

const toggleActionItem = async (req, res, next) => {
  try {
    const { chatId, actionItemId } = req.params;
    const userId = req.user._id;

    const chat = await ChatHistory.findOne({ _id: chatId, userId });

    if (!chat) {
      throw new ApiError("Conversation not found", 404);
    }

    const actionItem = await chat.toggleActionItem(actionItemId);

    res.status(200).json({
      success: true,
      message: `Action item marked as ${
        actionItem.completed ? "completed" : "incomplete"
      }`,
      data: { actionItem },
    });
  } catch (error) {
    next(error);
  }
};

const generateSummary = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await ChatHistory.findOne({ _id: chatId, userId });

    if (!chat) {
      throw new ApiError("Conversation not found", 404);
    }

    // Generate AI-powered summary
    const conversationText = chat.messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n\n");

    const summary = await claudeService.generateConversationSummary(
      conversationText
    );

    chat.summary = summary;
    await chat.save();

    res.status(200).json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    next(error);
  }
};

const getPinnedMessages = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const chats = await ChatHistory.find({
      userId,
      "messages.isPinned": true,
    }).select("title messages projectId createdAt");

    const pinnedMessages = [];

    chats.forEach((chat) => {
      chat.messages.forEach((msg) => {
        if (msg.isPinned) {
          pinnedMessages.push({
            chatId: chat._id,
            chatTitle: chat.title,
            projectId: chat.projectId,
            messageId: msg._id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          });
        }
      });
    });

    // Sort by timestamp, newest first
    pinnedMessages.sort((a, b) => b.timestamp - a.timestamp);

    res.status(200).json({
      success: true,
      data: {
        pinnedMessages,
        count: pinnedMessages.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

const exportConversation = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { format = "json" } = req.body;
    const userId = req.user._id;

    const chat = await ChatHistory.findOne({ _id: chatId, userId }).populate(
      "projectId",
      "name description"
    );

    if (!chat) {
      throw new ApiError("Conversation not found", 404);
    }

    let exportData;

    switch (format.toLowerCase()) {
      case "json":
        exportData = chat.toJSON();
        break;

      case "text":
        exportData = chat.messages
          .map(
            (msg) =>
              `[${msg.timestamp.toISOString()}] ${msg.role.toUpperCase()}: ${
                msg.content
              }`
          )
          .join("\n\n");
        break;

      case "markdown":
        exportData = `# ${chat.title}\n\n`;
        exportData += `**Project:** ${chat.projectId?.name || "Unknown"}\n`;
        exportData += `**Date:** ${chat.createdAt.toDateString()}\n\n`;
        exportData += `---\n\n`;
        chat.messages.forEach((msg) => {
          exportData += `### ${
            msg.role === "user" ? "👤 You" : "🤖 AI Assistant"
          }\n`;
          exportData += `*${msg.timestamp.toLocaleString()}*\n\n`;
          exportData += `${msg.content}\n\n`;
        });
        break;

      default:
        throw new ApiError(
          "Invalid export format. Use json, text, or markdown",
          400
        );
    }

    res.status(200).json({
      success: true,
      data: {
        format,
        content: exportData,
        filename: `chat-${chatId}-${Date.now()}.${
          format === "json" ? "json" : "txt"
        }`,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getSmartSuggestions = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findOne({ _id: projectId, userId });

    if (!project) {
      throw new ApiError("Project not found", 404);
    }

    const suggestions = await claudeService.generateSmartSuggestions(project);

    res.status(200).json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  handleInvestorObjection,
  getChatHistory,
  getConversation,
  deleteConversation,
  archiveConversation,
  pinMessage,
  starMessage,
  rateMessage,
  searchChats,
  getChatStats,
  addActionItem,
  toggleActionItem,
  generateSummary,
  getPinnedMessages,
  exportConversation,
  getSmartSuggestions,
};
