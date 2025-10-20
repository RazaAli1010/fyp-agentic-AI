import { useState, useCallback, useEffect } from "react";
import { io } from "socket.io-client";
import chatAPI from "@services/chat.api.js";
import { SOCKET_URL } from "@utils/constants.js";
import { toast } from "react-hot-toast";
import { getStorageItem, STORAGE_KEYS } from "@utils/helpers.js";

const useChat = (conversationId = null) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = getStorageItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("message", (message) => {
      setMessages((prev) => [...prev, message]);
      setIsTyping(false);
    });

    newSocket.on("typing", () => {
      setIsTyping(true);
    });

    newSocket.on("stop_typing", () => {
      setIsTyping(false);
    });

    newSocket.on("message_update", (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    newSocket.on("error", (error) => {
      toast.error(error.message || "An error occurred");
      setIsTyping(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
      fetchConversation(conversationId);

      if (socket && isConnected) {
        socket.emit("join_conversation", conversationId);
      }
    }
  }, [conversationId, socket, isConnected]);

  const fetchConversations = useCallback(async (projectId = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatAPI.getConversations(projectId);
      setConversations(response.data.conversations);
    } catch (err) {
      console.error("Fetch conversations error:", err);
      setError(err.response?.data?.message || "Failed to fetch conversations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchConversation = useCallback(async (id) => {
    try {
      const response = await chatAPI.getConversationById(id);
      setCurrentConversation(response.data.conversation);
      return response.data.conversation;
    } catch (err) {
      console.error("Fetch conversation error:", err);
      throw err;
    }
  }, []);

  const fetchMessages = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatAPI.getMessages(id);
      setMessages(response.data.messages);
    } catch (err) {
      console.error("Fetch messages error:", err);
      setError(err.response?.data?.message || "Failed to fetch messages");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatAPI.createConversation(data);
      setConversations((prev) => [response.data.conversation, ...prev]);
      return response.data.conversation;
    } catch (err) {
      console.error("Create conversation error:", err);
      setError(err.response?.data?.message || "Failed to create conversation");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content, mode = "general") => {
      if (!conversationId || !content.trim()) return;

      setIsSending(true);
      setError(null);

      const tempMessage = {
        _id: `temp-${Date.now()}`,
        content,
        sender: "user",
        createdAt: new Date(),
        isTemp: true,
      };

      setMessages((prev) => [...prev, tempMessage]);

      try {
        if (socket && isConnected) {
          socket.emit("send_message", {
            conversationId,
            content,
            mode,
          });
        } else {
          const response = await chatAPI.sendMessage(
            conversationId,
            content,
            mode
          );

          setMessages((prev) =>
            prev.filter((msg) => msg._id !== tempMessage._id)
          );

          setMessages((prev) => [
            ...prev,
            response.data.userMessage,
            response.data.aiMessage,
          ]);
        }
      } catch (err) {
        console.error("Send message error:", err);
        setError(err.response?.data?.message || "Failed to send message");
        toast.error("Failed to send message");

        setMessages((prev) =>
          prev.filter((msg) => msg._id !== tempMessage._id)
        );
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, socket, isConnected]
  );

  const regenerateResponse = useCallback(
    async (messageId) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await chatAPI.regenerateResponse(
          conversationId,
          messageId
        );

        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? response.data.message : msg
          )
        );

        toast.success("Response regenerated");
      } catch (err) {
        console.error("Regenerate response error:", err);
        setError(
          err.response?.data?.message || "Failed to regenerate response"
        );
        toast.error("Failed to regenerate response");
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  const deleteConversation = useCallback(
    async (id) => {
      try {
        await chatAPI.deleteConversation(id);
        setConversations((prev) => prev.filter((conv) => conv._id !== id));

        if (currentConversation?._id === id) {
          setCurrentConversation(null);
          setMessages([]);
        }

        toast.success("Conversation deleted");
      } catch (err) {
        console.error("Delete conversation error:", err);
        toast.error("Failed to delete conversation");
        throw err;
      }
    },
    [currentConversation]
  );

  const deleteMessage = useCallback(
    async (messageId) => {
      try {
        await chatAPI.deleteMessage(conversationId, messageId);
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        toast.success("Message deleted");
      } catch (err) {
        console.error("Delete message error:", err);
        toast.error("Failed to delete message");
        throw err;
      }
    },
    [conversationId]
  );

  const updateConversationTitle = useCallback(
    async (id, title) => {
      try {
        const response = await chatAPI.updateConversationTitle(id, title);

        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === id ? response.data.conversation : conv
          )
        );

        if (currentConversation?._id === id) {
          setCurrentConversation(response.data.conversation);
        }

        toast.success("Title updated");
      } catch (err) {
        console.error("Update title error:", err);
        toast.error("Failed to update title");
        throw err;
      }
    },
    [currentConversation]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    socket,
    isConnected,
    conversations,
    currentConversation,
    messages,
    isLoading,
    isSending,
    isTyping,
    error,
    fetchConversations,
    fetchConversation,
    fetchMessages,
    createConversation,
    sendMessage,
    regenerateResponse,
    deleteConversation,
    deleteMessage,
    updateConversationTitle,
    clearMessages,
    clearError,
    setCurrentConversation,
  };
};

export default useChat;
