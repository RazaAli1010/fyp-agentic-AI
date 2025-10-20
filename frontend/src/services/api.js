import axios from "axios";
import { API_URL, STORAGE_KEYS, HTTP_STATUS } from "@utils/constants.js";
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

apiClient.interceptors.request.use(
  (config) => {
    const token = getStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = getStorageItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
        removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
        removeStorageItem(STORAGE_KEYS.USER);

        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
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
