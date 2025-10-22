import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiMessageSquare,
  FiClock,
  FiPlus,
  FiInbox,
} from "react-icons/fi";

const ChatSidebar = ({ currentChatId, projectId, chatHistory = [], isLoading = false }) => {
  const navigate = useNavigate();

  console.log("ChatSidebar props:", { currentChatId, projectId, chatHistory, isLoading });

  const handleChatClick = (chatId) => {
    navigate(`/chat/${chatId}?projectId=${projectId}`);
  };

  const handleNewChat = () => {
    navigate(`/chat?projectId=${projectId}`);
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <FiPlus className="h-5 w-5" />
          <span className="font-semibold">New Conversation</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && chatHistory.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <FiInbox className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No conversations yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {chatHistory.map((chat) => (
              <motion.button
                key={chat._id}
                onClick={() => handleChatClick(chat._id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  currentChatId === chat._id
                    ? "bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-600"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <FiMessageSquare
                      className={`h-5 w-5 ${
                        currentChatId === chat._id
                          ? "text-purple-600"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium truncate ${
                        currentChatId === chat._id
                          ? "text-purple-900"
                          : "text-gray-900"
                      }`}
                    >
                      {chat.title || "New Conversation"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <FiClock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatDate(chat.lastMessageAt || chat.createdAt)}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {chat.messageCount || 0} messages
                      </span>
                    </div>
                    {chat.conversationType && chat.conversationType !== "general" && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        {chat.conversationType.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
