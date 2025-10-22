// frontend/src/services/auth.api.js
import api from './api';

const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response;
  },

  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout', { refreshToken });
    return response;
  },

  logoutAll: async () => {
    const response = await api.post('/auth/logout-all');
    return response;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response;
  },

  resetPassword: async (token, password, confirmPassword) => {
    const response = await api.post(`/auth/reset-password/${token}`, {
      password,
      confirmPassword
    });
    return response;
  },

  verifyResetToken: async (token) => {
    const response = await api.post(`/auth/verify-reset-token/${token}`);
    return response;
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
    return response;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response;
  },

  updateAvatar: async (formData) => {
    const response = await api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response;
  },

  deleteAccount: async (password) => {
    const response = await api.delete('/auth/account', { data: { password } });
    return response;
  },

  verifyToken: async () => {
    const response = await api.get('/auth/verify-token');
    return response;
  },

  checkUsername: async (username) => {
    const response = await api.post('/auth/check-username', { username });
    return response;
  },

  checkEmail: async (email) => {
    const response = await api.post('/auth/check-email', { email });
    return response;
  },

  getActivityLogs: async () => {
    const response = await api.get('/auth/activity-logs');
    return response;
  },

  getActiveSessions: async () => {
    const response = await api.get('/auth/active-sessions');
    return response;
  },

  revokeSession: async (tokenId) => {
    const response = await api.delete(`/auth/sessions/${tokenId}`);
    return response;
  },

  deactivateAccount: async (password) => {
    const response = await api.delete('/auth/account', { data: { password } });
    return response;
  },

  reactivateAccount: async (emailOrUsername, password) => {
    const response = await api.post('/auth/reactivate-account', {
      emailOrUsername,
      password
    });
    return response;
  }
};

export default authAPI;