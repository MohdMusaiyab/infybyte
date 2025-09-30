import { Route } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import { PrivateRoute } from "../components/auth/ProtectedRoute";

const AdminRoutes = () => (
  <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
    <Route element={<AdminLayout />}>
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      {/* Other admin pages */}
    </Route>
  </Route>
);

export default AdminRoutes;
