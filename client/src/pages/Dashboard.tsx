import { useAuth } from "../hooks/useAuth";

import AdminDashboard from "../components/admin/Dashboard";
import UserDashboard from "../components/user/Dashboard";
import VendorDashboard from "../components/vendor/Dashboard";

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name}!</p>

      {user.role === "admin" && <AdminDashboard />}
      {user.role === "user" && <UserDashboard />}
      {user.role === "vendor" && <VendorDashboard />}

      {!["admin", "user", "vendor"].includes(user.role) && (
        <p>Unauthorized role. Please contact support.</p>
      )}
    </div>
  );
};

export default Dashboard;
