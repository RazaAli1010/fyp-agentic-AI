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
  FiArrowRight
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import authAPI from '@services/auth.api';
import { useAuth } from '@hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    switch (name) {
      case 'emailOrUsername':
        if (!value.trim()) {
          newErrors.emailOrUsername = 'Email or username is required';
        } else if (value.trim().length < 3) {
          newErrors.emailOrUsername = 'Must be at least 3 characters';
        } else {
          delete newErrors.emailOrUsername;
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        } else {
          delete newErrors.password;
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
    setTouched({ emailOrUsername: true, password: true });
    const isEmailValid = validateField('emailOrUsername', formData.emailOrUsername);
    const isPasswordValid = validateField('password', formData.password);
    if (!isEmailValid || !isPasswordValid) {
      toast.error('Please fix all errors before submitting', { icon: '⚠️', duration: 3000 });
      return;
    }
    setIsLoading(true);
    try {
      const response = await authAPI.login(formData);
      login(response.data.tokens, response.data.user, rememberMe);
      toast.success(`Welcome back, ${response.data.user.name || response.data.user.username}! 🎉`, { duration: 2000, icon: '👋' });
      setTimeout(() => { navigate('/dashboard'); }, 500);
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(errorMessage, { duration: 4000, icon: '❌' });
      if (error.response?.status === 401) {
        setErrors({ emailOrUsername: 'Invalid credentials', password: 'Invalid credentials' });
        setTouched({ emailOrUsername: true, password: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => { setShowPassword(!showPassword); };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delayChildren: 0.2, staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } } };
  const shakeAnimation = { x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.4 } };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
        <motion.div animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 0] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
      </div>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md relative z-10">
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div className="flex justify-center mb-6" whileHover={{ scale: 1.05, rotate: 5 }} whileTap={{ scale: 0.95 }}>
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-4xl">🚀</span>
            </div>
          </motion.div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">Welcome Back</h2>
          <p className="text-gray-600 text-lg">Sign in to continue your startup journey</p>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div animate={errors.emailOrUsername && touched.emailOrUsername ? shakeAnimation : {}}>
                <label htmlFor="emailOrUsername" className="block text-sm font-semibold text-gray-700 mb-2">Email or Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'emailOrUsername' ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  <input id="emailOrUsername" name="emailOrUsername" type="text" autoComplete="username" value={formData.emailOrUsername} onChange={handleChange} onBlur={handleBlur} onFocus={() => handleFocus('emailOrUsername')} disabled={isLoading} className={`appearance-none block w-full pl-12 pr-12 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${errors.emailOrUsername && touched.emailOrUsername ? 'border-red-500 focus:border-red-600 bg-red-50' : focusedField === 'emailOrUsername' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`} placeholder="Enter your email or username" />
                  {!errors.emailOrUsername && touched.emailOrUsername && formData.emailOrUsername && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-y-0 right-0 pr-4 flex items-center"><FiCheckCircle className="h-5 w-5 text-green-500" /></motion.div>)}
                  {errors.emailOrUsername && touched.emailOrUsername && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-y-0 right-0 pr-4 flex items-center"><FiAlertCircle className="h-5 w-5 text-red-500" /></motion.div>)}
                </div>
                <AnimatePresence>
                  {errors.emailOrUsername && touched.emailOrUsername && (<motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-red-600 flex items-center"><FiAlertCircle className="mr-1 h-4 w-4" />{errors.emailOrUsername}</motion.p>)}
                </AnimatePresence>
              </motion.div>
              <motion.div animate={errors.password && touched.password ? shakeAnimation : {}}>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'password' ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={formData.password} onChange={handleChange} onBlur={handleBlur} onFocus={() => handleFocus('password')} disabled={isLoading} className={`appearance-none block w-full pl-12 pr-12 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${errors.password && touched.password ? 'border-red-500 focus:border-red-600 bg-red-50' : focusedField === 'password' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`} placeholder="Enter your password" />
                  <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-purple-600 transition-colors duration-200">{showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}</button>
                </div>
                <AnimatePresence>
                  {errors.password && touched.password && (<motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-red-600 flex items-center"><FiAlertCircle className="mr-1 h-4 w-4" />{errors.password}</motion.p>)}
                </AnimatePresence>
              </motion.div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer" />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none">Remember me</label>
                </div>
                <Link to="/forgot-password" className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200">Forgot password?</Link>
              </div>
              <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={`w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                {isLoading ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Signing in...</>) : (<>Sign in<FiArrowRight className="ml-2 h-5 w-5" /></>)}
              </motion.button>
            </form>
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500 font-medium">Don't have an account?</span></div>
              </div>
              <div className="mt-6">
                <Link to="/register">
                  <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full flex items-center justify-center py-3.5 px-4 border-2 border-purple-600 rounded-xl shadow-sm text-base font-semibold text-purple-600 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200">Create new account</motion.button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="mt-8 text-center text-sm text-gray-600">
          <p>By signing in, you agree to our <Link to="/terms" className="font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200">Terms of Service</Link> and <Link to="/privacy" className="font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200">Privacy Policy</Link></p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;