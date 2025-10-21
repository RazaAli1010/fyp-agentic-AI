import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser,
  FiMail,
  FiBriefcase,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheckCircle,
  FiLogOut,
  FiTrash2,
  FiSave,
  FiEdit2,
  FiX,
  FiMonitor,
  FiClock,
  FiShield
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import authAPI from '@services/auth.api';
import { useAuth } from '@hooks/useAuth';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState('personal');

  // Personal info state
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalData, setPersonalData] = useState({
    name: '',
    email: '',
    companyName: ''
  });
  const [personalErrors, setPersonalErrors] = useState({});
  const [personalTouched, setPersonalTouched] = useState({});
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordTouched, setPasswordTouched] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Focused fields
  const [focusedField, setFocusedField] = useState(null);

  // Load user data
  useEffect(() => {
    if (user) {
      setPersonalData({
        name: user.name || '',
        email: user.email || '',
        companyName: user.companyName || ''
      });
    }
  }, [user]);

  // Load sessions when security tab is active
  useEffect(() => {
    if (activeTab === 'security') {
      loadActiveSessions();
    }
  }, [activeTab]);

  // Load active sessions
  const loadActiveSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await authAPI.getActiveSessions();
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load active sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  };

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

  // Validate personal info
  const validatePersonalField = (name, value) => {
    const newErrors = { ...personalErrors };

    switch (name) {
      case 'name':
        if (value && value.length > 100) {
          newErrors.name = 'Name must be less than 100 characters';
        } else {
          delete newErrors.name;
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

    setPersonalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password
  const validatePasswordField = (name, value) => {
    const newErrors = { ...passwordErrors };

    switch (name) {
      case 'currentPassword':
        if (!value) {
          newErrors.currentPassword = 'Current password is required';
        } else {
          delete newErrors.currentPassword;
        }
        break;

      case 'newPassword':
        if (!value) {
          newErrors.newPassword = 'New password is required';
        } else if (value.length < 8) {
          newErrors.newPassword = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])/.test(value)) {
          newErrors.newPassword = 'Password must contain at least one lowercase letter';
        } else if (!/(?=.*[A-Z])/.test(value)) {
          newErrors.newPassword = 'Password must contain at least one uppercase letter';
        } else if (!/(?=.*[0-9])/.test(value)) {
          newErrors.newPassword = 'Password must contain at least one number';
        } else if (!/(?=.*[!@#$%^&*])/.test(value)) {
          newErrors.newPassword = 'Password must contain at least one special character';
        } else {
          delete newErrors.newPassword;
        }

        if (value) {
          setPasswordStrength(calculatePasswordStrength(value));
        }

        if (passwordData.confirmPassword) {
          if (value !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
          } else {
            delete newErrors.confirmPassword;
          }
        }
        break;

      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== passwordData.newPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;

      default:
        break;
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle personal info change
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalData(prev => ({ ...prev, [name]: value }));
    if (personalTouched[name]) {
      validatePersonalField(name, value);
    }
  };

  // Handle personal info blur
  const handlePersonalBlur = (e) => {
    const { name, value } = e.target;
    setPersonalTouched(prev => ({ ...prev, [name]: true }));
    validatePersonalField(name, value);
    setFocusedField(null);
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordTouched[name]) {
      validatePasswordField(name, value);
    }
  };

  // Handle password blur
  const handlePasswordBlur = (e) => {
    const { name, value } = e.target;
    setPasswordTouched(prev => ({ ...prev, [name]: true }));
    validatePasswordField(name, value);
    setFocusedField(null);
  };

  // Save personal info
  const handleSavePersonal = async () => {
    setPersonalTouched({ name: true, email: true, companyName: true });

    const isNameValid = validatePersonalField('name', personalData.name);
    const isEmailValid = validatePersonalField('email', personalData.email);
    const isCompanyValid = validatePersonalField('companyName', personalData.companyName);

    if (!isNameValid || !isEmailValid || !isCompanyValid) {
      toast.error('Please fix all errors before saving');
      return;
    }

    setIsSavingPersonal(true);

    try {
      const response = await authAPI.updateProfile(personalData);
      updateUser(response.data.user);
      setIsEditingPersonal(false);
      toast.success('Profile updated successfully! 🎉');
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsSavingPersonal(false);
    }
  };

  // Cancel personal edit
  const handleCancelPersonal = () => {
    setPersonalData({
      name: user.name || '',
      email: user.email || '',
      companyName: user.companyName || ''
    });
    setIsEditingPersonal(false);
    setPersonalErrors({});
    setPersonalTouched({});
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPasswordTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true
    });

    const isCurrentValid = validatePasswordField('currentPassword', passwordData.currentPassword);
    const isNewValid = validatePasswordField('newPassword', passwordData.newPassword);
    const isConfirmValid = validatePasswordField('confirmPassword', passwordData.confirmPassword);

    if (!isCurrentValid || !isNewValid || !isConfirmValid) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setIsChangingPassword(true);

    try {
      await authAPI.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordTouched({});
      setPasswordStrength({ score: 0, text: '', color: '' });

      toast.success('Password changed successfully! 🔐');
    } catch (error) {
      console.error('Password change error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Logout from all devices
  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to logout from all devices?')) {
      return;
    }

    try {
      await authAPI.logoutAll();
      logout();
      toast.success('Logged out from all devices');
      navigate('/login');
    } catch (error) {
      console.error('Logout all error:', error);
      toast.error('Failed to logout from all devices');
    }
  };

  // Revoke session
  const handleRevokeSession = async (sessionId) => {
    try {
      await authAPI.revokeSession(sessionId);
      toast.success('Session revoked successfully');
      loadActiveSessions();
    } catch (error) {
      console.error('Revoke session error:', error);
      toast.error('Failed to revoke session');
    }
  };

  // Deactivate account
  const handleDeactivateAccount = async () => {
    const password = window.prompt('Please enter your password to confirm account deactivation:');
    
    if (!password) return;

    try {
      await authAPI.deactivateAccount(password);
      logout();
      toast.success('Account deactivated successfully');
      navigate('/login');
    } catch (error) {
      console.error('Deactivate account error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to deactivate account';
      toast.error(errorMessage);
    }
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

  // Tab configuration
  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiShield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto relative z-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <FiUser className="text-4xl text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your account settings and preferences
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-2 border border-white/20">
            <div className="flex space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 flex items-center justify-center px-6 py-3 rounded-xl font-semibold
                      transition-all duration-200
                      ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'personal' && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                  {!isEditingPersonal ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditingPersonal(true)}
                      className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors duration-200"
                    >
                      <FiEdit2 className="mr-2 h-4 w-4" />
                      Edit
                    </motion.button>
                  ) : (
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancelPersonal}
                        className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors duration-200"
                      >
                        <FiX className="mr-2 h-4 w-4" />
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSavePersonal}
                        disabled={isSavingPersonal}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
                      >
                        {isSavingPersonal ? (
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <FiSave className="mr-2 h-4 w-4" />
                        )}
                        Save
                      </motion.button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Username (Read-only) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={user?.username || ''}
                        disabled
                        className="appearance-none block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-gray-500 bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
                  </div>

                  {/* Name */}
                  <motion.div animate={personalErrors.name && personalTouched.name ? shakeAnimation : {}}>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiUser className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'name' ? 'text-purple-600' : 'text-gray-400'}`} />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={personalData.name}
                        onChange={handlePersonalChange}
                        onBlur={handlePersonalBlur}
                        onFocus={() => setFocusedField('name')}
                        disabled={!isEditingPersonal}
                        className={`appearance-none block w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 ${
                          !isEditingPersonal 
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                            : personalErrors.name && personalTouched.name
                            ? 'border-red-500 focus:border-red-600 bg-red-50'
                            : focusedField === 'name'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                        }`}
                        placeholder="John Doe"
                      />
                    </div>
                    <AnimatePresence>
                      {personalErrors.name && personalTouched.name && (
                        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-red-600 flex items-center">
                          <FiAlertCircle className="mr-1 h-4 w-4" />
                          {personalErrors.name}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Email */}
                  <motion.div animate={personalErrors.email && personalTouched.email ? shakeAnimation : {}}>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiMail className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'email' ? 'text-purple-600' : 'text-gray-400'}`} />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={personalData.email}
                        onChange={handlePersonalChange}
                        onBlur={handlePersonalBlur}
                        onFocus={() => setFocusedField('email')}
                        disabled={!isEditingPersonal}
                        className={`appearance-none block w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 ${
                          !isEditingPersonal 
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                            : personalErrors.email && personalTouched.email
                            ? 'border-red-500 focus:border-red-600 bg-red-50'
                            : focusedField === 'email'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                        }`}
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <AnimatePresence>
                      {personalErrors.email && personalTouched.email && (
                        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-red-600 flex items-center">
                          <FiAlertCircle className="mr-1 h-4 w-4" />
                          {personalErrors.email}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Company Name */}
                  <motion.div animate={personalErrors.companyName && personalTouched.companyName ? shakeAnimation : {}}>
                    <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiBriefcase className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'companyName' ? 'text-purple-600' : 'text-gray-400'}`} />
                      </div>
                      <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        value={personalData.companyName}
                        onChange={handlePersonalChange}
                        onBlur={handlePersonalBlur}
                        onFocus={() => setFocusedField('companyName')}
                        disabled={!isEditingPersonal}
                        className={`appearance-none block w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 ${
                          !isEditingPersonal 
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                            : personalErrors.companyName && personalTouched.companyName
                            ? 'border-red-500 focus:border-red-600 bg-red-50'
                            : focusedField === 'companyName'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                        }`}
                        placeholder="Your Startup Inc."
                      />
                    </div>
                    <AnimatePresence>
                      {personalErrors.companyName && personalTouched.companyName && (
                        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-red-600 flex items-center">
                          <FiAlertCircle className="mr-1 h-4 w-4" />
                          {personalErrors.companyName}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Change Password */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-5">
                  {/* Current Password */}
                  <motion.div animate={passwordErrors.currentPassword && passwordTouched.currentPassword ? shakeAnimation : {}}>
                    <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLock className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'currentPassword' ? 'text-purple-600' : 'text-gray-400'}`} />
                      </div>
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        onBlur={handlePasswordBlur}
                        onFocus={() => setFocusedField('currentPassword')}
                        className={`appearance-none block w-full pl-12 pr-12 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 ${
                          passwordErrors.currentPassword && passwordTouched.currentPassword
                            ? 'border-red-500 focus:border-red-600 bg-red-50'
                            : focusedField === 'currentPassword'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                        }`}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-purple-600 transition-colors duration-200"
                      >
                        {showPasswords.current ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {passwordErrors.currentPassword && passwordTouched.currentPassword && (
                        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-red-600 flex items-center">
                          <FiAlertCircle className="mr-1 h-4 w-4" />
                          {passwordErrors.currentPassword}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* New Password */}
                  <motion.div animate={passwordErrors.newPassword && passwordTouched.newPassword ? shakeAnimation : {}}>
                    <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLock className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'newPassword' ? 'text-purple-600' : 'text-gray-400'}`} />
                      </div>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        onBlur={handlePasswordBlur}
                        onFocus={() => setFocusedField('newPassword')}
                        className={`appearance-none block w-full pl-12 pr-12 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 ${
                          passwordErrors.newPassword && passwordTouched.newPassword
                            ? 'border-red-500 focus:border-red-600 bg-red-50'
                            : focusedField === 'newPassword'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                        }`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-purple-600 transition-colors duration-200"
                      >
                        {showPasswords.new ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                      </button>
                    </div>

                    {/* Password Strength */}
                    {passwordData.newPassword && (
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
                      {passwordErrors.newPassword && passwordTouched.newPassword && (
                        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-red-600 flex items-center">
                          <FiAlertCircle className="mr-1 h-4 w-4" />
                          {passwordErrors.newPassword}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div animate={passwordErrors.confirmPassword && passwordTouched.confirmPassword ? shakeAnimation : {}}>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLock className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'confirmPassword' ? 'text-purple-600' : 'text-gray-400'}`} />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        onBlur={handlePasswordBlur}
                        onFocus={() => setFocusedField('confirmPassword')}
                        className={`appearance-none block w-full pl-12 pr-12 py-3.5 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 ${
                          passwordErrors.confirmPassword && passwordTouched.confirmPassword
                            ? 'border-red-500 focus:border-red-600 bg-red-50'
                            : focusedField === 'confirmPassword'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                        }`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-purple-600 transition-colors duration-200"
                      >
                        {showPasswords.confirm ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {passwordErrors.confirmPassword && passwordTouched.confirmPassword && (
                        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-red-600 flex items-center">
                          <FiAlertCircle className="mr-1 h-4 w-4" />
                          {passwordErrors.confirmPassword}
                        </motion.p>
                      )}
                      {!passwordErrors.confirmPassword && passwordTouched.confirmPassword && passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 text-sm text-green-600 flex items-center">
                          <FiCheckCircle className="mr-1 h-4 w-4" />
                          Passwords match
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isChangingPassword}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <FiLock className="mr-2 h-5 w-5" />
                        Change Password
                      </>
                    )}
                  </motion.button>
                </form>
              </div>

              {/* Active Sessions */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Active Sessions</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogoutAll}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200"
                  >
                    <FiLogOut className="mr-2 h-4 w-4" />
                    Logout All Devices
                  </motion.button>
                </div>

                {isLoadingSessions ? (
                  <div className="flex justify-center py-12">
                    <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FiMonitor className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                    <p>No active sessions found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <FiMonitor className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Device Session</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center">
                                <FiClock className="mr-1 h-4 w-4" />
                                {new Date(session.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRevokeSession(session.id)}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200"
                        >
                          Revoke
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-red-200 p-8">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Danger Zone</h2>
                <p className="text-gray-600 mb-6">
                  Once you deactivate your account, there is no going back. Please be certain.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeactivateAccount}
                  className="flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200"
                >
                  <FiTrash2 className="mr-2 h-5 w-5" />
                  Deactivate Account
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Profile;