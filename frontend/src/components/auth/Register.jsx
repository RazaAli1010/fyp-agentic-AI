import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiAlertCircle, 
  FiCheckCircle,
  FiUser,
  FiBriefcase,
  FiArrowRight,
  FiCheck
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import authAPI from '../services/auth.api';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    companyName: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (!password) return { score: 0, text: '', color: '' };

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, text: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, text: 'Medium', color: 'bg-yellow-500' };
    return { score, text: 'Strong', color: 'bg-green-500' };
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'username':
        if (!value.trim()) {
          newErrors.username = 'Username is required';
        } else if (value.length < 3) {
          newErrors.username = 'Username must be at least 3 characters';
        } else if (value.length > 30) {
          newErrors.username = 'Username must be less than 30 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          newErrors.username = 'Username can only contain letters, numbers, and underscores';
        } else {
          delete newErrors.username;
        }
        break;

      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])/.test(value)) {
          newErrors.password = 'Password must contain at least one lowercase letter';
        } else if (!/(?=.*[A-Z])/.test(value)) {
          newErrors.password = 'Password must contain at least one uppercase letter';
        } else if (!/(?=.*[0-9])/.test(value)) {
          newErrors.password = 'Password must contain at least one number';
        } else if (!/(?=.*[!@#$%^&*])/.test(value)) {
          newErrors.password = 'Password must contain at least one special character (!@#$%^&*)';
        } else {
          delete newErrors.password;
        }

        // Update password strength
        if (value) {
          setPasswordStrength(calculatePasswordStrength(value));
        }

        // Validate confirm password if it exists
        if (formData.confirmPassword) {
          if (value !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
          } else {
            delete newErrors.confirmPassword;
          }
        }
        break;

      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;

      case 'name':
        if (value && value.length > 100) {
          newErrors.name = 'Name must be less than 100 characters';
        } else {
          delete newErrors.name;
        }
        break;

      case 'companyName':
        if (value && value.length > 100) {
          newErrors.companyName = 'Company name must be less than 100 characters';
        } else {
          delete newErrors.companyName;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
    setFocusedField(null);
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all required fields as touched
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
      name: true,
      companyName: true
    });

    // Validate all fields
    const isUsernameValid = validateField('username', formData.username);
    const isEmailValid = validateField('email', formData.email);
    const isPasswordValid = validateField('password', formData.password);
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);
    const isNameValid = validateField('name', formData.name);
    const isCompanyNameValid = validateField('companyName', formData.companyName);

    // Check terms acceptance
    if (!acceptTerms) {
      toast.error('Please accept the Terms of Service and Privacy Policy', {
        icon: '⚠️',
        duration: 3000
      });
      return;
    }

    if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !isNameValid || !isCompanyNameValid) {
      toast.error('Please fix all errors before submitting', {
        icon: '⚠️',
        duration: 3000
      });
      return;
    }

    setIsLoading(true);

    try {
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.name || undefined,
        companyName: formData.companyName || undefined
      };

      const response = await authAPI.register(registrationData);

      // Auto-login after registration
      login(response.data.tokens, response.data.user, false);

      toast.success('Account created successfully! Welcome aboard! 🎉', {
        duration: 3000,
        icon: '🚀'
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error) {
      console.error('Registration error:', error);
      
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage, {
        duration: 4000,
        icon: '❌'
      });

      // Handle specific errors
      if (error.response?.status === 400) {
        const message = error.response.data.message;
        if (message.includes('email')) {
          setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
          setTouched(prev => ({ ...prev, email: true }));
        }
        if (message.includes('username')) {
          setErrors(prev => ({ ...prev, username: 'This username is already taken' }));
          setTouched(prev => ({ ...prev, username: true }));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

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

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl relative z-10"
      >
        {/* Logo and Title */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div 
            className="flex justify-center mb-6"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-4xl">🚀</span>
            </div>
          </motion.div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-600 text-lg">
            Start your startup journey with AI-powered tools
          </p>
        </motion.div>

        {/* Register Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20"
        >
          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Input */}
              <motion.div animate={errors.username && touched.username ? shakeAnimation : {}}>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiUser className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'username' ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={() => handleFocus('username')}
                    disabled={isLoading}
                    className={`appearance-none block w-full pl-12 pr-12 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${errors.username && touched.username ? 'border-red-500 focus:border-red-600 bg-red-50' : focusedField === 'username' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                    placeholder="Choose a unique username"
                  />
                  {!errors.username && touched.username && formData.username && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <FiCheckCircle className="h-5 w-5 text-green-500" />
                    </motion.div>
                  )}
                  {errors.username && touched.username && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <FiAlertCircle className="h-5 w-5 text-red-500" />
                    </motion.div>
                  )}
                </div>
                <AnimatePresence>
                  {errors.username && touched.username && (
                    <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-4 w-4" />
                      {errors.username}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Email Input */}
              <motion.div animate={errors.email && touched.email ? shakeAnimation : {}}>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'email' ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={() => handleFocus('email')}
                    disabled={isLoading}
                    className={`appearance-none block w-full pl-12 pr-12 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${errors.email && touched.email ? 'border-red-500 focus:border-red-600 bg-red-50' : focusedField === 'email' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                    placeholder="your.email@example.com"
                  />
                  {!errors.email && touched.email && formData.email && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <FiCheckCircle className="h-5 w-5 text-green-500" />
                    </motion.div>
                  )}
                  {errors.email && touched.email && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <FiAlertCircle className="h-5 w-5 text-red-500" />
                    </motion.div>
                  )}
                </div>
                <AnimatePresence>
                  {errors.email && touched.email && (
                    <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-4 w-4" />
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Two Column Layout for Name and Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name Input */}
                <motion.div animate={errors.name && touched.name ? shakeAnimation : {}}>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiUser className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'name' ? 'text-purple-600' : 'text-gray-400'}`} />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() => handleFocus('name')}
                      disabled={isLoading}
                      className={`appearance-none block w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${errors.name && touched.name ? 'border-red-500 focus:border-red-600 bg-red-50' : focusedField === 'name' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                      placeholder="John Doe"
                    />
                  </div>
                  <AnimatePresence>
                    {errors.name && touched.name && (
                      <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-red-600 flex items-center">
                        <FiAlertCircle className="mr-1 h-4 w-4" />
                        {errors.name}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Company Name Input */}
                <motion.div animate={errors.companyName && touched.companyName ? shakeAnimation : {}}>
                  <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Name <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiBriefcase className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'companyName' ? 'text-purple-600' : 'text-gray-400'}`} />
                    </div>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      autoComplete="organization"
                      value={formData.companyName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() => handleFocus('companyName')}
                      disabled={isLoading}
                      className={`appearance-none block w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${errors.companyName && touched.companyName ? 'border-red-500 focus:border-red-600 bg-red-50' : focusedField === 'companyName' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                      placeholder="Your Startup Inc."
                    />
                  </div>
                  <AnimatePresence>
                    {errors.companyName && touched.companyName && (
                      <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-red-600 flex items-center">
                        <FiAlertCircle className="mr-1 h-4 w-4" />
                        {errors.companyName}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Password Input */}
              <motion.div animate={errors.password && touched.password ? shakeAnimation : {}}>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'password' ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={() => handleFocus('password')}
                    disabled={isLoading}
                    className={`appearance-none block w-full pl-12 pr-12 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${errors.password && touched.password ? 'border-red-500 focus:border-red-600 bg-red-50' : focusedField === 'password' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-purple-600 transition-colors duration-200"
                  >
                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 font-medium">Password Strength:</span>
                      <span className={`text-xs font-semibold ${passwordStrength.score <= 2 ? 'text-red-600' : passwordStrength.score <= 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                        transition={{ duration: 0.3 }}
                        className={`h-full rounded-full ${passwordStrength.color}`}
                      />
                    </div>
                  </motion.div>
                )}

                <AnimatePresence>
                  {errors.password && touched.password && (
                    <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-4 w-4" />
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Confirm Password Input */}
              <motion.div animate={errors.confirmPassword && touched.confirmPassword ? shakeAnimation : {}}>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'confirmPassword' ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={() => handleFocus('confirmPassword')}
                    disabled={isLoading}
                    className={`appearance-none block w-full pl-12 pr-12 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500 focus:border-red-600 bg-red-50' : focusedField === 'confirmPassword' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-purple-600 transition-colors duration-200"
                  >
                    {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-4 w-4" />
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                  {!errors.confirmPassword && touched.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-green-600 flex items-center">
                      <FiCheckCircle className="mr-1 h-4 w-4" />
                      Passwords match
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Terms & Conditions */}
              <motion.div className="flex items-start">
                <div className="flex items-center h-5 mt-1">
                  <input
                    id="accept-terms"
                    name="accept-terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="accept-terms" className="text-gray-700 cursor-pointer select-none">
                    I agree to the{' '}
                    <Link to="/terms" className="font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <FiArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    Already have an account?
                  </span>
                </div>
              </div>

              {/* Sign In Link */}
              <div className="mt-6">
                <Link to="/login">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center py-3.5 px-4 border-2 border-purple-600 rounded-xl shadow-sm text-base font-semibold text-purple-600 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                  >
                    Sign in instead
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          variants={itemVariants}
          className="mt-8 text-center text-sm text-gray-600"
        >
          <p>
            By creating an account, you're joining thousands of entrepreneurs 
            building the future with AI-powered tools.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;