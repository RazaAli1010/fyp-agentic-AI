const Input = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  touched,
  required = false,
  disabled = false,
  icon: Icon,
  iconPosition = "left",
  helperText,
  className = "",
}) => {
  const hasError = error && touched;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && iconPosition === "left" && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="h-5 w-5" />
          </div>
        )}

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            appearance-none block w-full px-4 py-3 
            ${Icon && iconPosition === "left" ? "pl-12" : ""}
            ${Icon && iconPosition === "right" ? "pr-12" : ""}
            border-2 rounded-xl text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-0 transition-all duration-200
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${
              hasError
                ? "border-red-500 focus:border-red-600 bg-red-50"
                : "border-gray-200 hover:border-gray-300 focus:border-purple-500 bg-gray-50"
            }
            ${className}
          `}
        />

        {Icon && iconPosition === "right" && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {hasError && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {helperText && !hasError && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
