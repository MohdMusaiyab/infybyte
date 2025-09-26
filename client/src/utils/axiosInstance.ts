// utils/axiosInstance.ts
import axios, { AxiosError } from "axios";
import type { AxiosResponse, AxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";
import type { LoginResponse, ApiResponse } from "../types/auth";

const BASE_URL = "http://localhost:8080/api/v1";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send HttpOnly cookie automatically
});

// Attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor → refresh token if 401
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const store = useAuthStore.getState();

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post<ApiResponse<LoginResponse>>(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true } // send refresh token cookie
        );

        const { access_token } = res.data.data ?? {};

        if (!access_token ) {
          store.logout();
          return Promise.reject(error);
        }
        const { user } = store;
        store.setUser(user!, access_token);

        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${access_token}`;
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        store.logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
