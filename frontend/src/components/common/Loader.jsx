import { motion } from "framer-motion";

const Loader = ({
  size = "md",
  color = "primary",
  fullScreen = false,
  text = ""
}) => {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4"
  };

  const colors = {
    primary: "border-purple-600 border-t-transparent",
    secondary: "border-gray-600 border-t-transparent",
    white: "border-white border-t-transparent",
    blue: "border-blue-600 border-t-transparent"
  };

  const spinnerElement = (
    <motion.div
      className={`${sizes[size]} ${colors[color]} rounded-full`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          {spinnerElement}
          {text && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white text-lg font-medium"
            >
              {text}
            </motion.p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        {spinnerElement}
        {text && (
          <p className="text-gray-600 text-sm font-medium">{text}</p>
        )}
      </div>
    </div>
  );
};

export default Loader;
