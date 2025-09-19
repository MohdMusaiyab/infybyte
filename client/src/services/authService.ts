import api from "../api/axios";
import { tokenManager } from "../utils/tokenManager";
import { useAuthStore } from "../store/authStore";
import {
  type LoginCredentials,
  type LoginResponse,
  type ApiResponse,
  type User,
  type RegisterCredentials,
  type RegisterResponse,
} from "../types/auth";

export const authService = {
  async login(credentials: LoginCredentials): Promise<void> {
    try {
      useAuthStore.getState().setLoading(true);

      const response = await api.post<ApiResponse<LoginResponse>>(
        "/api/v1/auth/login",
        credentials
      );

      const { access_token, refresh_token, user } = response.data.data;

      // Store tokens
      tokenManager.setTokens(access_token, refresh_token);

      // Update auth store
      useAuthStore.getState().setAuth(user, true);
    } catch (error: unknown) {
      useAuthStore.getState().setLoading(false);
      
      // Check for axios error with response data
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object"
      ) {
        const axiosError = error.response as { data?: { message?: string; error?: string }; status?: number; statusText?: string };
        
        // Try to get detailed error message from different response formats
        if (axiosError.data?.message) {
          throw new Error(axiosError.data.message);
        } else if (axiosError.data?.error) {
          throw new Error(axiosError.data.error);
        } else if (typeof axiosError.data === 'string') {
          throw new Error(axiosError.data);
        } else if (axiosError.statusText) {
          throw new Error(`${axiosError.status}: ${axiosError.statusText}`);
        }
      }
      
      // Fallback error message
      throw new Error("Login failed. Please check your credentials and try again.");
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  },

  async register(
    credentials: RegisterCredentials
  ): Promise<RegisterResponse["user"]> {
    try {
      useAuthStore.getState().setLoading(true);

      const response = await api.post<ApiResponse<RegisterResponse>>(
        "/api/v1/auth/register",
        credentials
      );

      return response.data.data.user;
    } catch (error: unknown) {
      useAuthStore.getState().setLoading(false);
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
      ) {
        throw new Error(
          (error.response as { data: { message?: string } }).data.message ||
            "Registration failed"
        );
      }
      throw new Error("Registration failed");
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  },
  async logout(): Promise<void> {
    try {
      // Call logout API to invalidate tokens on server
      await api.post("/auth/logout");
    } catch (error) {
      console.log("Logout API call failed:", error);
    } finally {
      // Clear local data regardless of API success
      tokenManager.clearTokens();
      useAuthStore.getState().logout();
    }
  },

  async refreshAuth(): Promise<boolean> {
    try {
      const refreshToken = tokenManager.getRefreshToken();

      if (!refreshToken) {
        return false;
      }

      const response = await api.post<
        ApiResponse<{
          user: User;
          access_token: string;
          refresh_token?: string;
        }>
      >("/auth/refresh", {
        refresh_token: refreshToken,
      });

      const {
        user,
        access_token,
        refresh_token: newRefreshToken,
      } = response.data.data;

      // Update tokens
      tokenManager.setTokens(access_token, newRefreshToken || refreshToken);

      // Update auth store
      useAuthStore.getState().setAuth(user, true);

      return true;
    } catch (error) {
      console.log("Auth refresh failed:", error);
      tokenManager.clearTokens();
      useAuthStore.getState().logout();
      return false;
    }
  },

  async getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data.data.user;
  },
};
