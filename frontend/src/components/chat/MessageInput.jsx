import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FiSend, FiPaperclip, FiX } from "react-icons/fi";

const MessageInput = ({
  onSend,
  disabled = false,
  placeholder = "Type your message...",
}) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {attachments.length > 0 && (
        <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200"
            >
              <span className="text-sm text-purple-700 truncate max-w-[200px]">
                {file.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-purple-600 hover:text-purple-800"
              >
                <FiX className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end gap-3">
          <label className="flex-shrink-0 cursor-pointer">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
            />
            <div className="p-3 rounded-xl hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-purple-600">
              <FiPaperclip className="h-5 w-5" />
            </div>
          </label>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-purple-500 transition-colors duration-200 max-h-32 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="flex-shrink-0 p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <FiSend className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-xs text-gray-500">
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">
              Enter
            </kbd>{" "}
            to send,{" "}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">
              Shift + Enter
            </kbd>{" "}
            for new line
          </p>
          <p className="text-xs text-gray-500">{message.length} / 2000</p>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
