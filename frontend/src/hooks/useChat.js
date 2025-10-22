import { useState, useCallback, useEffect, useRef } from "react";
import chatAPI from "@services/chat.api.js";
import { toast } from "react-hot-toast";

/**
 * Custom hook for chat functionality without WebSocket
 * Uses REST API for all chat operations
 */
const useChat = (chatId = null, projectId = null) => {
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchedChatId = useRef(null);

  /**
   * Fetch a specific chat conversation
   */
  const fetchChat = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatAPI.getConversation(id);
      // Backend returns { success: true, data: { conversation: chat } }
      const chat = response.data.conversation || response.data;

      setCurrentChat(chat);
      setMessages(chat.messages || []);

      return chat;
    } catch (err) {
      console.error("Fetch chat error:", err);
      const errorMessage = err.response?.data?.message || "Failed to fetch conversation";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch chat history for a project
   */
  const fetchChatHistory = useCallback(async (projId) => {
    console.log("fetchChatHistory called with projectId:", projId);
    setIsLoadingHistory(true);
    setError(null);

    try {
      const response = await chatAPI.getChatHistory(projId);
      console.log("Chat history API response:", response);
      console.log("Response structure:", {
        hasData: !!response.data,
        hasChats: !!response.data?.chats,
        chatsType: typeof response.data?.chats,
        chatsLength: Array.isArray(response.data?.chats) ? response.data.chats.length : 'not an array'
      });

      // Backend returns { success: true, data: { chats: [...], pagination: {...} } }
      const chats = response.data?.chats || response.data || [];
      console.log("Extracted chats:", chats);
      console.log("Setting chatHistory to:", chats.length, "chats");
      setChatHistory(chats);
      return chats;
    } catch (err) {
      console.error("Fetch chat history error:", err);
      console.error("Error response:", err.response);
      const errorMessage = err.response?.data?.message || "Failed to fetch chat history";
      setError(errorMessage);
      // Don't show toast for history fetch errors
      throw err;
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  /**
   * Send a message in the chat
   */
  const sendMessage = useCallback(
    async (content, conversationType = "general") => {
      if (!projectId || !content.trim()) {
        toast.error("Project ID and message content are required");
        return;
      }

      setIsSending(true);
      setError(null);

      // Add temporary user message to UI
      const tempUserMessage = {
        _id: `temp-user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        createdAt: new Date(),
        isTemp: true,
      };

      setMessages((prev) => [...prev, tempUserMessage]);

      try {
        const response = await chatAPI.sendMessage(
          projectId,
          content.trim(),
          conversationType,
          chatId
        );

        const { chatId: newChatId, message: aiMessage, messageId } = response.data;

        // Remove temp message and add both user and AI messages
        setMessages((prev) => {
          const filtered = prev.filter((msg) => !msg.isTemp);
          return [
            ...filtered,
            {
              _id: messageId,
              role: "user",
              content: content.trim(),
              createdAt: new Date(),
            },
            {
              _id: `ai-${messageId}`,
              role: "assistant",
              content: aiMessage,
              createdAt: new Date(),
              metadata: response.data.metadata,
            },
          ];
        });

        // Update current chat with new chatId if this was the first message
        if (!chatId && newChatId) {
          setCurrentChat({ _id: newChatId, title: "New Conversation" });
          lastFetchedChatId.current = newChatId;
        }

        // Refresh chat history to show the updated conversation
        if (projectId) {
          fetchChatHistory(projectId);
        }

        return { chatId: newChatId, message: aiMessage };
      } catch (err) {
        console.error("Send message error:", err);

        // Remove temp message
        setMessages((prev) => prev.filter((msg) => !msg.isTemp));

        const errorMessage = err.response?.data?.message || "Failed to send message";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [projectId, chatId, fetchChatHistory]
  );

  /**
   * Delete a chat conversation
   */
  const deleteChat = useCallback(async (id) => {
    try {
      await chatAPI.deleteConversation(id);

      if (currentChat?._id === id) {
        setCurrentChat(null);
        setMessages([]);
      }

      setChatHistory((prev) => prev.filter((chat) => chat._id !== id));
      toast.success("Conversation deleted");
    } catch (err) {
      console.error("Delete chat error:", err);
      const errorMessage = err.response?.data?.message || "Failed to delete conversation";
      toast.error(errorMessage);
      throw err;
    }
  }, [currentChat]);

  /**
   * Archive a chat conversation
   */
  const archiveChat = useCallback(async (id) => {
    try {
      await chatAPI.archiveConversation(id);

      setChatHistory((prev) =>
        prev.map((chat) =>
          chat._id === id ? { ...chat, archived: true } : chat
        )
      );

      toast.success("Conversation archived");
    } catch (err) {
      console.error("Archive chat error:", err);
      toast.error("Failed to archive conversation");
      throw err;
    }
  }, []);

  /**
   * Pin a message
   */
  const pinMessage = useCallback(async (messageId) => {
    if (!chatId) return;

    try {
      await chatAPI.pinMessage(chatId, messageId);

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, pinned: true } : msg
        )
      );

      toast.success("Message pinned");
    } catch (err) {
      console.error("Pin message error:", err);
      toast.error("Failed to pin message");
      throw err;
    }
  }, [chatId]);

  /**
   * Star a message
   */
  const starMessage = useCallback(async (messageId) => {
    if (!chatId) return;

    try {
      await chatAPI.starMessage(chatId, messageId);

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, starred: true } : msg
        )
      );

      toast.success("Message starred");
    } catch (err) {
      console.error("Star message error:", err);
      toast.error("Failed to star message");
      throw err;
    }
  }, [chatId]);

  /**
   * Rate a message
   */
  const rateMessage = useCallback(async (messageId, rating) => {
    if (!chatId) return;

    try {
      await chatAPI.rateMessage(chatId, messageId, rating);

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, rating } : msg
        )
      );

      toast.success("Message rated");
    } catch (err) {
      console.error("Rate message error:", err);
      toast.error("Failed to rate message");
      throw err;
    }
  }, [chatId]);

  /**
   * Clear messages from state
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch chat conversation when chatId changes
  useEffect(() => {
    // Only fetch if chatId changed and we don't already have messages for this chat
    if (chatId && chatId !== lastFetchedChatId.current) {
      lastFetchedChatId.current = chatId;
      fetchChat(chatId);
    } else if (!chatId) {
      // Clear messages when there's no chatId (new conversation)
      setMessages([]);
      setCurrentChat(null);
      lastFetchedChatId.current = null;
    }
  }, [chatId, fetchChat]);

  // Fetch chat history when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchChatHistory(projectId);
    }
  }, [projectId, fetchChatHistory]);

  return {
    // State
    currentChat,
    messages,
    chatHistory,
    isLoading,
    isLoadingHistory,
    isSending,
    error,

    // Actions
    fetchChat,
    fetchChatHistory,
    sendMessage,
    deleteChat,
    archiveChat,
    pinMessage,
    starMessage,
    rateMessage,
    clearMessages,
    clearError,
    setCurrentChat,
  };
};

export default useChat;
