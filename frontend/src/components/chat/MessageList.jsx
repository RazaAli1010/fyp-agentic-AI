import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  FiUser,
  FiCpu,
  FiRefreshCw,
  FiCopy,
  FiTrash2,
  FiCheck,
} from "react-icons/fi";
import { formatDateTime } from "@utils/helpers.js";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MessageList = ({ messages, isTyping, onRegenerate, onDelete }) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const MessageBubble = ({ message, index }) => {
    const isUser = message.sender === "user" || message.type === "user";
    const isAI = message.sender === "ai" || message.type === "ai";

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`flex gap-4 ${
          isUser ? "flex-row-reverse" : "flex-row"
        } group`}
      >
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isUser
              ? "bg-gradient-to-br from-purple-500 to-blue-500"
              : "bg-gradient-to-br from-green-500 to-teal-500"
          }`}
        >
          {isUser ? (
            <FiUser className="h-5 w-5 text-white" />
          ) : (
            <FiCpu className="h-5 w-5 text-white" />
          )}
        </div>

        <div
          className={`flex-1 max-w-3xl ${
            isUser ? "flex flex-col items-end" : ""
          }`}
        >
          <div
            className={`rounded-2xl px-5 py-3 ${
              isUser
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-900"
            }`}
          >
            {isAI ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-4 mb-2">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-4 mb-2">{children}</ol>
                    ),
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    code: ({ inline, children }) =>
                      inline ? (
                        <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono">
                          {children}
                        </code>
                      ) : (
                        <code className="block p-3 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono">
                          {children}
                        </code>
                      ),
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>

          <div
            className={`flex items-center gap-2 mt-2 px-2 ${
              isUser ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <span className="text-xs text-gray-500">
              {formatDateTime(message.createdAt)}
            </span>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => handleCopy(message.content)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                title="Copy message"
              >
                <FiCopy className="h-3.5 w-3.5" />
              </button>

              {isAI && onRegenerate && (
                <button
                  onClick={() => onRegenerate(message._id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  title="Regenerate response"
                >
                  <FiRefreshCw className="h-3.5 w-3.5" />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(message._id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors duration-200"
                  title="Delete message"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCpu className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Start a Conversation
            </h3>
            <p className="text-gray-600 mb-6">
              Ask me anything about your startup, get strategic advice, or
              practice answering investor questions.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                "Help me validate my startup idea",
                "How do I find my target market?",
                "What should be in my pitch deck?",
                "Practice investor questions with me",
              ].map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl text-left text-sm text-gray-700 hover:from-purple-100 hover:to-blue-100 transition-all duration-200"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <MessageBubble
              key={message._id || index}
              message={message}
              index={index}
            />
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                <FiCpu className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 max-w-3xl">
                <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

export default MessageList;
