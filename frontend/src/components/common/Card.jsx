import { motion } from "framer-motion";

const Card = ({
  children,
  className = "",
  padding = "lg",
  hover = false,
  onClick,
}) => {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <motion.div
      whileHover={hover ? { y: -4 } : {}}
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-200
        ${paddingClasses[padding]}
        ${
          hover
            ? "cursor-pointer transition-shadow duration-200 hover:shadow-lg"
            : ""
        }
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default Card;
