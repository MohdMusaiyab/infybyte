import { useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import axiosInstance from "../utils/axiosInstance";
import type {
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../types/auth";

export const useAuth = () => {
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    setUser,
    logout,
    setLoading,
  } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setLoading(true);
      try {
        const res = await axiosInstance.post("/auth/login", credentials);
        console.log(res.data);
        const { access_token, user: loggedUser } = res.data.data;
        setUser(loggedUser, access_token);
        setLoading(false);
        return loggedUser;
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [setUser, setLoading]
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      setLoading(true);
      try {
        const res = await axiosInstance.post("/auth/register", credentials);
        const registeredUser: User = res.data.data;
        console.log(registeredUser);
        setLoading(false);
        return registeredUser;
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [setLoading]
  );

  const logoutUser = useCallback(async () => {
    setLoading(true);
    try {
      await axiosInstance.post("/logout");
      logout();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [logout, setLoading]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout: logoutUser,
  };
};
