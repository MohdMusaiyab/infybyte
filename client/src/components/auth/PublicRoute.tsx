import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    // Already logged in → redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Not logged in → show content
  return <>{children}</>;
};
