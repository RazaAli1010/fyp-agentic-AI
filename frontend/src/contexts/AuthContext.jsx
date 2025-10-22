import { createContext, useState, useEffect, useCallback } from "react";
import authAPI from "@services/auth.api";
import { setAuthToken, removeAuthToken } from "@services/api";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from "@utils/helpers";
import { STORAGE_KEYS } from "@utils/constants";
import { toast } from "react-hot-toast";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const token = getStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
      const storedUser = getStorageItem(STORAGE_KEYS.USER);

      if (token && storedUser) {
        setAuthToken(token);
        setUser(storedUser);
        setIsAuthenticated(true);

        try {
          const response = await authAPI.getCurrentUser();
          // FIXED: Handle different response structures
          const userData =
            response.data.data?.user || response.data.user || response.data;
          setUser(userData);
          setStorageItem(STORAGE_KEYS.USER, userData);
        } catch (error) {
          if (error.response?.status === 401) {
            await handleLogout();
          }
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Check auth error:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(credentials);

      // FIXED: Handle different response structures
      const data = response.data.data || response.data;
      const { accessToken, refreshToken, user: userData } = data;

      // Validate tokens exist
      if (!accessToken || !refreshToken) {
        throw new Error("Invalid response: missing tokens");
      }

      setAuthToken(accessToken);
      setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      setStorageItem(STORAGE_KEYS.USER, userData);

      setUser(userData);
      setIsAuthenticated(true);

      toast.success(`Welcome back, ${userData.name || userData.username}!`);

      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.register(userData);

      // FIXED: Handle different response structures
      const data = response.data.data || response.data;
      const { accessToken, refreshToken, user: newUser } = data;

      // Validate tokens exist
      if (!accessToken || !refreshToken) {
        throw new Error("Invalid response: missing tokens");
      }

      setAuthToken(accessToken);
      setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      setStorageItem(STORAGE_KEYS.USER, newUser);

      setUser(newUser);
      setIsAuthenticated(true);

      toast.success(
        `Welcome to Startup Advisor, ${newUser.name || newUser.username}!`
      );

      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Registration failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      const refreshToken = getStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await handleLogout();
    }
  };

  const handleLogout = async () => {
    removeAuthToken();
    removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
    removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
    removeStorageItem(STORAGE_KEYS.USER);

    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);

    toast.success("Logged out successfully");
  };

  const forgotPassword = async (email) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.forgotPassword(email);
      toast.success("Password reset link sent to your email");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to send reset link";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.resetPassword(token, newPassword);
      toast.success("Password reset successful");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to reset password";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyResetToken = async (token) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.verifyResetToken(token);
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Invalid or expired token";
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.updateProfile(updates);
      // FIXED: Handle different response structures
      const updatedUser =
        response.data.data?.user || response.data.user || response.data;

      setUser(updatedUser);
      setStorageItem(STORAGE_KEYS.USER, updatedUser);

      toast.success("Profile updated successfully");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update profile";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.changePassword(
        currentPassword,
        newPassword
      );
      toast.success("Password changed successfully");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to change password";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      // FIXED: Handle different response structures
      const userData =
        response.data.data?.user || response.data.user || response.data;

      setUser(userData);
      setStorageItem(STORAGE_KEYS.USER, userData);

      return userData;
    } catch (error) {
      console.error("Refresh user data error:", error);
      throw error;
    }
  };

  const updateAvatar = async (file) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await authAPI.updateAvatar(formData);
      // FIXED: Handle different response structures
      const updatedUser =
        response.data.data?.user || response.data.user || response.data;

      setUser(updatedUser);
      setStorageItem(STORAGE_KEYS.USER, updatedUser);

      toast.success("Avatar updated successfully");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update avatar";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (password) => {
    setIsLoading(true);
    setError(null);

    try {
      await authAPI.deleteAccount(password);
      await handleLogout();
      toast.success("Account deleted successfully");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete account";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyResetToken,
    updateProfile,
    changePassword,
    updateAvatar,
    deleteAccount,
    refreshUserData,
    checkAuth,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
