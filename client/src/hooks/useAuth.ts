import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setLoading } = useAuthStore();

  // Initialize auth on app start
  useEffect(() => {
    const initAuth = async () => {
      if (!isAuthenticated) {
        setLoading(true);
        const success = await authService.refreshAuth();
        if (!success) {
          setLoading(false);
        }
      }
    };

    initAuth();
  }, [isAuthenticated, setLoading]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login: authService.login,
    logout: authService.logout,
    refreshAuth: authService.refreshAuth,
  };
};