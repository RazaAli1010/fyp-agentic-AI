// frontend/src/services/auth.api.js
import api from './api';

const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  },

  logoutAll: async () => {
    const response = await api.post('/auth/logout-all');
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, password, confirmPassword) => {
    const response = await api.post(`/auth/reset-password/${token}`, {
      password,
      confirmPassword
    });
    return response.data;
  },

  verifyResetToken: async (token) => {
    const response = await api.post(`/auth/verify-reset-token/${token}`);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  verifyToken: async () => {
    const response = await api.get('/auth/verify-token');
    return response.data;
  },

  checkUsername: async (username) => {
    const response = await api.post('/auth/check-username', { username });
    return response.data;
  },

  checkEmail: async (email) => {
    const response = await api.post('/auth/check-email', { email });
    return response.data;
  },

  getActivityLogs: async () => {
    const response = await api.get('/auth/activity-logs');
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await api.get('/auth/active-sessions');
    return response.data;
  },

  revokeSession: async (tokenId) => {
    const response = await api.delete(`/auth/sessions/${tokenId}`);
    return response.data;
  },

  deactivateAccount: async (password) => {
    const response = await api.delete('/auth/account', { data: { password } });
    return response.data;
  },

  reactivateAccount: async (emailOrUsername, password) => {
    const response = await api.post('/auth/reactivate-account', {
      emailOrUsername,
      password
    });
    return response.data;
  }
};

export default authAPI;