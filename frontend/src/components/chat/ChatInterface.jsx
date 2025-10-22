import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiMoreVertical,
  FiTrash2,
  FiDownload,
  FiEdit2,
} from "react-icons/fi";
import MessageList from "./MessageList.jsx";
import MessageInput from "./MessageInput.jsx";
import ChatSidebar from "./ChatSidebar.jsx";
import useChat from "@hooks/useChat.js";
import LoadingSpinner from "@components/shared/LoadingSpinner.jsx";
import { toast } from "react-hot-toast";

const ChatInterface = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const {
    currentChat,
    messages,
    chatHistory,
    isLoading,
    isLoadingHistory,
    isSending,
    sendMessage,
    deleteChat,
    pinMessage,
    starMessage,
    rateMessage,
  } = useChat(chatId, projectId);

  const [showMenu, setShowMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (currentChat) {
      setTitle(currentChat.title || "New Conversation");
    }
  }, [currentChat]);

  // Redirect if no projectId is provided
  useEffect(() => {
    if (!projectId) {
      toast.error("Please select a project to start chatting");
      navigate("/dashboard");
    }
  }, [projectId, navigate]);

  const handleSendMessage = async (content) => {
    try {
      const result = await sendMessage(content);

      // If this was the first message and we got a new chatId, navigate to it
      // Only navigate if we actually don't have a chatId yet
      if (!chatId && result?.chatId) {
        // Use replace to avoid creating browser history entry
        // This prevents the page from appearing to reload
        navigate(`/chat/${result.chatId}?projectId=${projectId}`, {
          replace: true,
          state: { skipFetch: true } // Signal to skip refetching
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handlePinMessage = async (messageId) => {
    await pinMessage(messageId);
  };

  const handleStarMessage = async (messageId) => {
    await starMessage(messageId);
  };

  const handleRateMessage = async (messageId, rating) => {
    await rateMessage(messageId, rating);
  };

  const handleDeleteConversation = async () => {
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      await deleteChat(chatId);
      navigate(`/dashboard`);
    }
  };

  const handleUpdateTitle = async () => {
    // TODO: Implement title update API call
    if (title.trim() && title !== currentChat?.title) {
      toast.info("Title update coming soon!");
    }
    setIsEditingTitle(false);
  };

  const handleExport = async () => {
    try {
      toast.success("Export feature coming soon!");
    } catch (error) {
      toast.error("Failed to export conversation");
    }
  };

  if (!projectId) {
    return null;
  }

  if (isLoading && !currentChat && chatId) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" text="Loading conversation..." />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Chat History Sidebar */}
      <ChatSidebar
        currentChatId={chatId}
        projectId={projectId}
        chatHistory={chatHistory}
        isLoading={isLoadingHistory}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-full">
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <FiArrowLeft className="h-5 w-5 text-gray-600" />
          </button>

          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleUpdateTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateTitle();
                if (e.key === "Escape") {
                  setTitle(currentChat?.title || "New Conversation");
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="px-3 py-1.5 border-2 border-purple-500 rounded-lg focus:outline-none"
            />
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentChat?.title || "New Conversation"}
              </h2>
              {chatId && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <FiEdit2 className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
          )}
        </div>

        {chatId && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <FiMoreVertical className="h-5 w-5 text-gray-600" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20"
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleExport();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200"
                  >
                    <FiDownload className="h-4 w-4" />
                    Export Chat
                  </button>

                  <div className="border-t border-gray-200 my-2" />

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleDeleteConversation();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors duration-200"
                  >
                    <FiTrash2 className="h-4 w-4" />
                    Delete Conversation
                  </button>
                </motion.div>
              </>
            )}
          </div>
        )}
      </div>

      <MessageList
        messages={messages}
        isTyping={isSending}
        onPin={handlePinMessage}
        onStar={handleStarMessage}
        onRate={handleRateMessage}
      />

        <MessageInput
          onSend={handleSendMessage}
          disabled={isSending}
          placeholder="Ask me anything about your startup..."
        />
      </div>
    </div>
  );
};

export default ChatInterface;
