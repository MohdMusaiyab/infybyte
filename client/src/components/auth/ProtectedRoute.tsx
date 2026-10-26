import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

interface PrivateRouteProps {
  allowedRoles: string[];
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const dashboardRoutes: Record<string, string> = {
      admin: "/admin/dashboard",
      vendor: "/vendor/dashboard",
      manager: "/manager/dashboard",
      user: "/user/dashboard",
    };
    const targetDashboard = dashboardRoutes[user.role] || "/unauthorized";
    return <Navigate to={targetDashboard} replace />;
  }

  return <Outlet />;
};
