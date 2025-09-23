import React from "react";
import { useAuth } from "../hooks/useAuth";
import AdminDashboard from "../components/admin/Dashboard";
import UserDashboard from "../components/user/Dashboard";
import VendorDashboard from "../components/vendor/Dashboard";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="text-center mt-20 text-xl">Please log in...</div>;
  }

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "vendor":
      return <VendorDashboard />;
    case "user":
      return <UserDashboard />;
    default:
      return <div className="text-center mt-20 text-xl">Invalid role</div>;
  }
};

export default DashboardPage;
