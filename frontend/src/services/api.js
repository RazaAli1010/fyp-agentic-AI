import axios from "axios";
import { API_URL, STORAGE_KEYS, HTTP_STATUS } from "@utils/constants";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from "@utils/helpers";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request queue for handling token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.url}`);
    const token = getStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
    console.log('🔑 Token from storage:', token ? `${token.substring(0, 20)}...` : 'NULL');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization header set');
    } else {
      console.warn('⚠️ No token found in storage');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or already retried, reject immediately
    if (
      error.response?.status !== HTTP_STATUS.UNAUTHORIZED ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // If currently refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getStorageItem(STORAGE_KEYS.REFRESH_TOKEN);

    // If no refresh token, logout and redirect
    if (!refreshToken) {
      console.error("No refresh token available");
      isRefreshing = false;
      processQueue(new Error("No refresh token available"), null);

      // Clear storage and redirect to login
      removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
      removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
      removeStorageItem(STORAGE_KEYS.USER);

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    try {
      // Call refresh token endpoint
      const response = await axios.post(`${API_URL}/auth/refresh-token`, {
        refreshToken,
      });

      // FIXED: Handle different response structures
      const data = response.data.data || response.data;
      const { accessToken, refreshToken: newRefreshToken } = data;

      if (!accessToken) {
        throw new Error("No access token received");
      }

      // Update tokens in storage
      setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (newRefreshToken) {
        setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
      }

      // Update authorization header
      apiClient.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${accessToken}`;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      // Process queued requests
      processQueue(null, accessToken);

      isRefreshing = false;

      // Retry original request
      return apiClient(originalRequest);
    } catch (refreshError) {
      console.error("Token refresh failed:", refreshError);

      processQueue(refreshError, null);
      isRefreshing = false;

      // Clear storage and redirect to login
      removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
      removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
      removeStorageItem(STORAGE_KEYS.USER);

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    }
  }
);

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
    removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
  }
};

export const removeAuthToken = () => {
  delete apiClient.defaults.headers.common["Authorization"];
  removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
  removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export default apiClient;
