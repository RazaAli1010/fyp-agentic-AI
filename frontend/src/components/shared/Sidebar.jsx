import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiFolder,
  FiMessageSquare,
  FiBarChart2,
  FiX,
} from "react-icons/fi";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: FiHome },
    { name: "Projects", href: "/projects", icon: FiFolder },
    { name: "AI Chat", href: "/chat", icon: FiMessageSquare },
    { name: "Analytics", href: "/analytics", icon: FiBarChart2 },
  ];

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -320,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 bottom-0 w-80 bg-white border-r border-gray-200 z-50 lg:translate-x-0 lg:static"
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 lg:hidden">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">SA</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Startup Advisor
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <FiX className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Need Help?
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Get personalized advice from our AI assistant
            </p>
            <Link
              to="/chat"
              onClick={() => window.innerWidth < 1024 && onClose()}
              className="block w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-center"
            >
              Start Chat
            </Link>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
