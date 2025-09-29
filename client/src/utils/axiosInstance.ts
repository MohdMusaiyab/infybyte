// src/utils/axiosInstance.ts
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // important for cookies
});

// Request interceptor → add Authorization
axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor → handle 401 and refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { access_token, user } = res.data.data;
        useAuthStore.getState().setAuth(user, access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        useAuthStore.getState().logout();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
