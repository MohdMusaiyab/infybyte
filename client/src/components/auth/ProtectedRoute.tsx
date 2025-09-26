import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

interface PrivateRouteProps {
  allowedRoles: string[];
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuthStore();

  if (!user) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Logged in but wrong role → forbidden
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  // Correct role → render children
  return <Outlet />;
};
