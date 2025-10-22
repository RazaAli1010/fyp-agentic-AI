import apiClient from "./api.js";

const chatAPI = {
  // Get chat history for a project
  getChatHistory: async (projectId) => {
    const response = await apiClient.get(`/chat/history/${projectId}`);
    console.log("getChatHistory raw axios response:", response);
    console.log("getChatHistory response.data:", response.data);
    return response.data;
  },

  // Get a specific conversation
  getConversation: async (chatId) => {
    const response = await apiClient.get(`/chat/conversation/${chatId}`);
    return response.data;
  },

  // Delete a conversation
  deleteConversation: async (chatId) => {
    const response = await apiClient.delete(`/chat/conversation/${chatId}`);
    return response.data;
  },

  // Send a message (creates conversation if chatId not provided)
  sendMessage: async (projectId, message, conversationType = "general", chatId = null) => {
    const payload = {
      projectId,
      message,
      conversationType,
    };

    // Only include chatId if it has a valid value
    if (chatId) {
      payload.chatId = chatId;
    }

    const response = await apiClient.post("/chat/message", payload);
    return response.data;
  },

  // Archive a conversation
  archiveConversation: async (chatId) => {
    const response = await apiClient.put(`/chat/conversation/${chatId}/archive`);
    return response.data;
  },

  // Pin a message
  pinMessage: async (chatId, messageId) => {
    const response = await apiClient.post(
      `/chat/message/${chatId}/${messageId}/pin`
    );
    return response.data;
  },

  // Star a message
  starMessage: async (chatId, messageId) => {
    const response = await apiClient.post(
      `/chat/message/${chatId}/${messageId}/star`
    );
    return response.data;
  },

  // Rate a message
  rateMessage: async (chatId, messageId, rating) => {
    const response = await apiClient.post(
      `/chat/message/${chatId}/${messageId}/rate`,
      { rating }
    );
    return response.data;
  },

  // Handle investor objections
  handleInvestorObjection: async (projectId, objection, customObjection = null) => {
    const response = await apiClient.post("/chat/investor-objection", {
      projectId,
      objection,
      customObjection,
    });
    return response.data;
  },

  // Get chat statistics
  getChatStats: async () => {
    const response = await apiClient.get("/chat/stats");
    return response.data;
  },

  // Search chats
  searchChats: async (query) => {
    const response = await apiClient.get("/chat/search", {
      params: { query },
    });
    return response.data;
  },

  // Export conversation
  exportConversation: async (chatId) => {
    const response = await apiClient.post(`/chat/export/${chatId}`);
    return response.data;
  },

  // Get smart suggestions
  getSmartSuggestions: async (projectId) => {
    const response = await apiClient.get(`/chat/suggestions/${projectId}`);
    return response.data;
  },

  // Get pinned messages
  getPinnedMessages: async () => {
    const response = await apiClient.get("/chat/pinned");
    return response.data;
  },

  // Add action item
  addActionItem: async (chatId, text) => {
    const response = await apiClient.post("/chat/action-item", {
      chatId,
      text,
    });
    return response.data;
  },

  // Toggle action item
  toggleActionItem: async (chatId, actionItemId) => {
    const response = await apiClient.put(
      `/chat/action-item/${chatId}/${actionItemId}/toggle`
    );
    return response.data;
  },

  // Generate summary
  generateSummary: async (chatId) => {
    const response = await apiClient.post(`/chat/conversation/${chatId}/summary`);
    return response.data;
  },
};

export default chatAPI;
