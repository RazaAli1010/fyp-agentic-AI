import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMail, 
  FiAlertCircle, 
  FiCheckCircle,
  FiArrowRight,
  FiArrowLeft
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import authAPI from '../services/auth.api';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [focusedField, setFocusedField] = useState(false);

  // Email validation
  const validateEmail = (value) => {
    if (!value.trim()) {
      setError('Email is required');
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Please enter a valid email address');
      return false;
    } else {
      setError('');
      return true;
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (touched) {
      validateEmail(value);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validateEmail(email);
    setFocusedField(false);
  };

  const handleFocus = () => {
    setFocusedField(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address', {
        icon: '⚠️',
        duration: 3000
      });
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.forgotPassword(email);

      setIsSubmitted(true);

      toast.success('Password reset link sent! Check your email 📧', {
        duration: 5000,
        icon: '✅'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Even on error, show success message for security (don't reveal if email exists)
      setIsSubmitted(true);
      
      toast.success('If an account exists with this email, you will receive a password reset link.', {
        duration: 5000,
        icon: '📧'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };

  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        />
        <motion.div 
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        />
        <motion.div 
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        />
      </div>

      {/* Main Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        {/* Logo and Title */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div 
            className="flex justify-center mb-6"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-4xl">🔐</span>
            </div>
          </motion.div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Forgot Password?
          </h2>
          <p className="text-gray-600 text-lg">
            No worries! We'll send you reset instructions
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20"
        >
          <div className="p-8 sm:p-10">
            {!isSubmitted ? (
              // Form View
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Info Message */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FiMail className="h-5 w-5 text-blue-500 mt-0.5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Input */}
                <motion.div
                  animate={error && touched ? shakeAnimation : {}}
                >
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className={`h-5 w-5 transition-colors duration-200 ${
                        focusedField 
                          ? 'text-purple-600' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                      disabled={isLoading}
                      className={`
                        appearance-none block w-full pl-12 pr-12 py-3.5 
                        border-2 rounded-xl text-gray-900 placeholder-gray-400
                        focus:outline-none focus:ring-0 transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${error && touched
                          ? 'border-red-500 focus:border-red-600 bg-red-50'
                          : focusedField
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                        }
                      `}
                      placeholder="your.email@example.com"
                    />
                    {/* Success Icon */}
                    {!error && touched && email && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        <FiCheckCircle className="h-5 w-5 text-green-500" />
                      </motion.div>
                    )}
                    {/* Error Icon */}
                    {error && touched && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        <FiAlertCircle className="h-5 w-5 text-red-500" />
                      </motion.div>
                    )}
                  </div>
                  <AnimatePresence>
                    {error && touched && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-2 text-sm text-red-600 flex items-center"
                      >
                        <FiAlertCircle className="mr-1 h-4 w-4" />
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full flex items-center justify-center py-3.5 px-4 
                    border border-transparent rounded-xl shadow-lg text-base font-semibold 
                    text-white bg-gradient-to-r from-purple-600 to-blue-600 
                    hover:from-purple-700 hover:to-blue-700
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                    transition-all duration-200
                    ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                  `}
                >
                  {isLoading ? (
                    <>
                      <svg 
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                        />
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <FiArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </motion.button>

                {/* Back to Login */}
                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200"
                  >
                    <FiArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </form>
            ) : (
              // Success View
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-6"
              >
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2
                  }}
                  className="flex justify-center"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <FiCheckCircle className="h-10 w-10 text-white" />
                  </div>
                </motion.div>

                {/* Success Message */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Check Your Email
                  </h3>
                  <p className="text-gray-600">
                    We've sent a password reset link to
                  </p>
                  <p className="text-purple-600 font-semibold mt-1">
                    {email}
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-gray-50 rounded-xl p-6 text-left">
                  <h4 className="font-semibold text-gray-900 mb-3">Next steps:</h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                        1
                      </span>
                      <span>Check your email inbox (and spam folder)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                        2
                      </span>
                      <span>Click the password reset link</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                        3
                      </span>
                      <span>Create a new secure password</span>
                    </li>
                  </ol>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg text-left">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FiAlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        The reset link will expire in <strong>30 minutes</strong> for security reasons.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <motion.button
                    onClick={handleBackToLogin}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                  >
                    <FiArrowLeft className="mr-2 h-5 w-5" />
                    Back to Login
                  </motion.button>

                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  >
                    Didn't receive the email? Try again
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Footer Help */}
        <motion.div 
          variants={itemVariants}
          className="mt-8 text-center text-sm text-gray-600"
        >
          <p>
            Need help?{' '}
            <Link 
              to="/contact" 
              className="font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200"
            >
              Contact Support
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;