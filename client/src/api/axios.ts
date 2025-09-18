import axios from 'axios';
import { tokenManager } from '../utils/tokenManager';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor - Add access token to requests
api.interceptors.request.use(
  (config) => {
    const accessToken = tokenManager.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenManager.getRefreshToken();
      
      if (refreshToken) {
        try {
          console.log('Attempting token refresh...');
          
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data.data;
          
          // Update tokens
          tokenManager.setTokens(access_token, newRefreshToken || refreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
          
        } catch (refreshError) {
          console.log('Token refresh failed, logging out...');
          
          // Refresh failed - logout user
          tokenManager.clearTokens();
          useAuthStore.getState().logout();
          
          // Redirect to login
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token - logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;