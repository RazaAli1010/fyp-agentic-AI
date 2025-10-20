import apiClient from "./api.js";

const chatAPI = {
  getConversations: async (projectId = null) => {
    const url = projectId
      ? `/chat/conversations?projectId=${projectId}`
      : "/chat/conversations";
    const response = await apiClient.get(url);
    return response.data;
  },

  getConversationById: async (conversationId) => {
    const response = await apiClient.get(
      `/chat/conversations/${conversationId}`
    );
    return response.data;
  },

  createConversation: async (data) => {
    const response = await apiClient.post("/chat/conversations", data);
    return response.data;
  },

  deleteConversation: async (conversationId) => {
    const response = await apiClient.delete(
      `/chat/conversations/${conversationId}`
    );
    return response.data;
  },

  sendMessage: async (conversationId, content, mode = "general") => {
    const response = await apiClient.post(
      `/chat/conversations/${conversationId}/messages`,
      {
        content,
        mode,
      }
    );
    return response.data;
  },

  getMessages: async (conversationId, page = 1, limit = 50) => {
    const response = await apiClient.get(
      `/chat/conversations/${conversationId}/messages`,
      {
        params: { page, limit },
      }
    );
    return response.data;
  },

  updateMessage: async (conversationId, messageId, updates) => {
    const response = await apiClient.patch(
      `/chat/conversations/${conversationId}/messages/${messageId}`,
      updates
    );
    return response.data;
  },

  deleteMessage: async (conversationId, messageId) => {
    const response = await apiClient.delete(
      `/chat/conversations/${conversationId}/messages/${messageId}`
    );
    return response.data;
  },

  regenerateResponse: async (conversationId, messageId) => {
    const response = await apiClient.post(
      `/chat/conversations/${conversationId}/messages/${messageId}/regenerate`
    );
    return response.data;
  },

  getInvestorObjections: async (projectId) => {
    const response = await apiClient.get(
      `/chat/investor-objections/${projectId}`
    );
    return response.data;
  },

  generateInvestorObjections: async (projectId, category = null) => {
    const response = await apiClient.post(
      `/chat/investor-objections/${projectId}/generate`,
      {
        category,
      }
    );
    return response.data;
  },

  answerInvestorObjection: async (projectId, objectionId) => {
    const response = await apiClient.post(
      `/chat/investor-objections/${projectId}/${objectionId}/answer`
    );
    return response.data;
  },

  rateInvestorAnswer: async (projectId, objectionId, rating) => {
    const response = await apiClient.post(
      `/chat/investor-objections/${projectId}/${objectionId}/rate`,
      { rating }
    );
    return response.data;
  },

  getConversationStats: async () => {
    const response = await apiClient.get("/chat/stats");
    return response.data;
  },

  searchMessages: async (query, conversationId = null) => {
    const params = { query };
    if (conversationId) params.conversationId = conversationId;

    const response = await apiClient.get("/chat/search", { params });
    return response.data;
  },

  exportConversation: async (conversationId, format = "json") => {
    const response = await apiClient.post(
      `/chat/conversations/${conversationId}/export`,
      { format }
    );
    return response.data;
  },

  updateConversationTitle: async (conversationId, title) => {
    const response = await apiClient.patch(
      `/chat/conversations/${conversationId}`,
      {
        title,
      }
    );
    return response.data;
  },

  pinConversation: async (conversationId) => {
    const response = await apiClient.patch(
      `/chat/conversations/${conversationId}/pin`
    );
    return response.data;
  },

  archiveConversation: async (conversationId) => {
    const response = await apiClient.patch(
      `/chat/conversations/${conversationId}/archive`
    );
    return response.data;
  },

  getAISuggestions: async (projectId, context) => {
    const response = await apiClient.post("/chat/suggestions", {
      projectId,
      context,
    });
    return response.data;
  },
};

export default chatAPI;
