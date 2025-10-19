import { Route } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import { PrivateRoute } from "../components/auth/ProtectedRoute";
import AllUsers from "../pages/admin/AllUsers";
import Profile from "../pages/admin/Profile";
import AllVendors from "../pages/admin/AllVendors";
import VendorDetails from "../pages/admin/VendorDetails";
import AllFoodCourts from "../pages/admin/AllFoodCourts";
import SingleFoodCourtDetails from "../pages/admin/SingleFoodCourtDetails";

const AdminRoutes = () => (
  <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
    <Route element={<AdminLayout />}>
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/all-users" element={<AllUsers />} />
      <Route path="/admin/all-vendors" element={<AllVendors />} />
      <Route path="/admin/vendor/:id" element={<VendorDetails />} />
      <Route path="/admin/profile" element={<Profile />} />

      {/* ===============Food Court Related========================== */}
      <Route path="/admin/food-courts" element={<AllFoodCourts />} />
      <Route  path="/admin/food-courts/:id" element={<SingleFoodCourtDetails />}
      />
    </Route>
  </Route>
);

export default AdminRoutes;
