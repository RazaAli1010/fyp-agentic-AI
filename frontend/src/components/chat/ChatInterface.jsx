import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import useChat from "@hooks/useChat.js";
import LoadingSpinner from "@components/shared/LoadingSpinner.jsx";
import { toast } from "react-hot-toast";

const ChatInterface = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const {
    currentConversation,
    messages,
    isLoading,
    isSending,
    isTyping,
    sendMessage,
    regenerateResponse,
    deleteMessage,
    deleteConversation,
    updateConversationTitle,
  } = useChat(conversationId);

  const [showMenu, setShowMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (currentConversation) {
      setTitle(currentConversation.title || "New Conversation");
    }
  }, [currentConversation]);

  const handleSendMessage = async (content) => {
    await sendMessage(content);
  };

  const handleRegenerate = async (messageId) => {
    await regenerateResponse(messageId);
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      await deleteMessage(messageId);
    }
  };

  const handleDeleteConversation = async () => {
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      await deleteConversation(conversationId);
      navigate("/chat");
    }
  };

  const handleUpdateTitle = async () => {
    if (title.trim() && title !== currentConversation?.title) {
      await updateConversationTitle(conversationId, title.trim());
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

  if (isLoading && !currentConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" text="Loading conversation..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/chat")}
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
                  setTitle(currentConversation?.title || "New Conversation");
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="px-3 py-1.5 border-2 border-purple-500 rounded-lg focus:outline-none"
            />
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentConversation?.title || "New Conversation"}
              </h2>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <FiEdit2 className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          )}
        </div>

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
      </div>

      <MessageList
        messages={messages}
        isTyping={isTyping}
        onRegenerate={handleRegenerate}
        onDelete={handleDeleteMessage}
      />

      <MessageInput
        onSend={handleSendMessage}
        disabled={isSending}
        placeholder="Ask me anything about your startup..."
      />
    </div>
  );
};

export default ChatInterface;
