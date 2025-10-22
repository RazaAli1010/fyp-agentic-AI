const ChatHistory = require("../models/ChatHistory.js");
const Project = require("../models/project.js");
const claudeService = require("../services/claude.service.js");
const ragService = require("../services/rag.service.js");
const { ApiError } = require("../utils/helpers.js");

// Constants
const CONVERSATION_HISTORY_LIMIT = 10;
const MAX_PAGINATION_LIMIT = 100;
const DEFAULT_PAGINATION_LIMIT = 10;
const DEFAULT_SEARCH_LIMIT = 20;

const sendMessage = async (req, res, next) => {
  console.log("\n=== 🚀 SEND MESSAGE STARTED ===");
  console.log("⏰ Timestamp:", new Date().toISOString());

  try {
    console.log("📦 Request Body:", JSON.stringify(req.body, null, 2));
    console.log("👤 Request User:", req.user ? {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email
    } : "NO USER");

    const {
      projectId,
      message,
      conversationType = "general",
      chatId,
    } = req.body;
    const userId = req.user._id;

    console.log("✅ Extracted params:", { projectId, conversationType, chatId, userId: userId?.toString() });
    console.log("📝 Message length:", message?.length || 0);

    // Validate required fields
    if (!projectId) {
      console.error("❌ Missing projectId");
      throw new ApiError("Project ID is required", 400);
    }
    if (!message || message.trim().length === 0) {
      console.error("❌ Missing or empty message");
      throw new ApiError("Message is required", 400);
    }

    console.log("🔍 Finding project with:", { _id: projectId, userId: userId?.toString() });
    const project = await Project.findOne({ _id: projectId, userId });
    console.log("📁 Project found:", project ? {
      _id: project._id,
      name: project.name,
      userId: project.userId
    } : "NULL");

    if (!project) {
      console.error("❌ Project not found or access denied");
      throw new ApiError("Project not found", 404);
    }

    let chatHistory;
    if (chatId) {
      console.log("🔍 Looking for existing chat:", chatId);
      chatHistory = await ChatHistory.findOne({ _id: chatId, userId });
      console.log("💬 Existing chat found:", !!chatHistory);

      if (!chatHistory) {
        console.error("❌ Chat not found");
        throw new ApiError("Chat conversation not found", 404);
      }
    } else {
      console.log("🆕 Creating new chat history");
      chatHistory = new ChatHistory({
        userId,
        projectId,
        conversationType,
      });
      console.log("✅ New chat history created (not saved yet)");
    }

    console.log("💾 Adding user message to chat history");
    await chatHistory.addMessage("user", message);
    console.log("✅ User message added, chat messages count:", chatHistory.messages?.length || 0);

    console.log("🏗️ Building project context with RAG service");
    let projectContext;
    try {
      projectContext = await ragService.buildProjectContext(project);
      console.log("✅ Project context built:", projectContext ? "SUCCESS" : "NULL");
      console.log("📊 Context length:", typeof projectContext === 'string' ? projectContext.length : JSON.stringify(projectContext).length);
    } catch (ragError) {
      console.error("❌ RAG Service Error:", ragError.message);
      console.error("RAG Error Stack:", ragError.stack);
      throw new ApiError("Failed to build project context: " + ragError.message, 500);
    }

    if (!projectContext) {
      console.error("❌ Project context is null/undefined");
      throw new ApiError("Failed to build project context", 500);
    }

    const conversationHistory = chatHistory.messages.slice(-CONVERSATION_HISTORY_LIMIT).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
    console.log("📚 Conversation history length:", conversationHistory.length);

    // Generate AI response
    console.log("🤖 Calling Claude service for AI response");
    const startTime = Date.now();
    let aiResponse;
    try {
      aiResponse = await claudeService.generateResponse(
        message,
        conversationHistory,
        projectContext,
        conversationType
      );
      const responseTime = Date.now() - startTime;
      console.log("✅ AI Response received in", responseTime, "ms");
      console.log("🤖 AI Response:", {
        hasContent: !!aiResponse?.content,
        contentLength: aiResponse?.content?.length || 0,
        model: aiResponse?.model,
        usage: aiResponse?.usage,
        complexity: aiResponse?.complexity
      });
    } catch (claudeError) {
      console.error("❌ Claude Service Error:", claudeError.message);
      console.error("Claude Error Stack:", claudeError.stack);
      console.error("Claude Error Details:", JSON.stringify(claudeError, null, 2));
      throw new ApiError("AI service error: " + claudeError.message, 500);
    }

    const responseTime = Date.now() - startTime;

    // Add assistant message with metadata
    console.log("💾 Adding assistant message to chat history");
    try {
      await chatHistory.addMessage("assistant", aiResponse.content, {
        model: aiResponse.model,
        tokensUsed: aiResponse.usage,
        complexity: aiResponse.complexity,
        responseTime,
      });
      console.log("✅ Assistant message added, total messages:", chatHistory.messages?.length || 0);
    } catch (addMsgError) {
      console.error("❌ Error adding assistant message:", addMsgError.message);
      console.error("Add Message Error Stack:", addMsgError.stack);
      throw addMsgError;
    }

    const responseData = {
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
    };

    console.log("📤 Sending response:", {
      success: responseData.success,
      chatId: responseData.data.chatId,
      messageLength: responseData.data.message?.length || 0,
      messageId: responseData.data.messageId
    });
    console.log("=== ✅ SEND MESSAGE COMPLETED ===\n");

    res.status(200).json(responseData);
  } catch (error) {
    console.error("\n=== ❌ SEND MESSAGE ERROR ===");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Error Status Code:", error.statusCode || 500);
    console.error("Error Stack:", error.stack);
    console.error("Full Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("=== END ERROR ===\n");
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
    if (!projectContext) {
      throw new ApiError("Failed to build project context", 500);
    }

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
    console.log("getChatHistory called");
    const { projectId } = req.params;
    const userId = req.user?._id;

    console.log("Request params:", { projectId, userId });

    if (!userId) {
      console.error("No user ID found in request");
      throw new ApiError("User not authenticated", 401);
    }

    if (!projectId) {
      console.error("No project ID provided");
      throw new ApiError("Project ID is required", 400);
    }

    // Validate ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      console.error("Invalid project ID format:", projectId);
      throw new ApiError("Invalid project ID format", 400);
    }

    let { limit = DEFAULT_PAGINATION_LIMIT, page = 1 } = req.query;

    // Validate and constrain pagination parameters
    limit = Math.min(Math.max(parseInt(limit) || DEFAULT_PAGINATION_LIMIT, 1), MAX_PAGINATION_LIMIT);
    page = Math.max(parseInt(page) || 1, 1);

    console.log("Pagination:", { limit, page });

    // Verify project belongs to user
    console.log("Looking for project:", { _id: projectId, userId });
    const project = await Project.findOne({ _id: projectId, userId });

    if (!project) {
      console.error("Project not found or doesn't belong to user");
      throw new ApiError("Project not found", 404);
    }

    console.log("Project found:", project._id);

    const skip = (page - 1) * limit;

    console.log("Fetching chats with query:", { userId, projectId, isActive: true });
    const chats = await ChatHistory.find({ userId, projectId, isActive: true })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        "title conversationType messageCount lastMessageAt createdAt tags"
      );

    console.log("Chats found:", chats.length);

    const total = await ChatHistory.countDocuments({
      userId,
      projectId,
      isActive: true,
    });

    console.log("Total chat count:", total);

    const response = {
      success: true,
      data: {
        chats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalChats: total,
          hasMore: skip + chats.length < total,
        },
      },
    };

    console.log("Sending response with", chats.length, "chats");
    res.status(200).json(response);
  } catch (error) {
    console.error("getChatHistory error:", error);
    console.error("Error stack:", error.stack);
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

    // Validate rating is an integer between 1 and 5
    const parsedRating = parseInt(rating);
    if (!rating || !Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw new ApiError("Rating must be an integer between 1 and 5", 400);
    }

    const chat = await ChatHistory.findOne({ _id: chatId, userId });

    if (!chat) {
      throw new ApiError("Conversation not found", 404);
    }

    await chat.rateMessage(messageId, parsedRating, feedback);

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
    let { query, limit = DEFAULT_SEARCH_LIMIT } = req.query;
    const userId = req.user._id;

    if (!query || query.trim().length === 0) {
      throw new ApiError("Search query is required", 400);
    }

    // Validate and constrain limit
    limit = Math.min(Math.max(parseInt(limit) || DEFAULT_SEARCH_LIMIT, 1), MAX_PAGINATION_LIMIT);

    const results = await ChatHistory.searchChats(
      userId,
      query.trim(),
      limit
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

    // Run all queries in parallel for better performance
    const [stats, pinnedCount, starredCount] = await Promise.all([
      ChatHistory.getUserChatStats(userId),
      ChatHistory.countDocuments({
        userId,
        "messages.isPinned": true,
      }),
      ChatHistory.countDocuments({
        userId,
        "messages.isStarred": true,
      }),
    ]);

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
