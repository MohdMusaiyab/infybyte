import { lazy } from "react";
import { Route } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import { PrivateRoute } from "../components/auth/ProtectedRoute";

const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AllUsers = lazy(() => import("../pages/admin/AllUsers"));
const AllVendors = lazy(() => import("../pages/admin/AllVendors"));
const AllManagers = lazy(() => import("../pages/admin/AllManagers"));
const VendorDetails = lazy(() => import("../pages/admin/VendorDetails"));
const Profile = lazy(() => import("../pages/admin/Profile"));
const AllFoodCourts = lazy(() => import("../pages/admin/AllFoodCourts"));
const SingleFoodCourtDetails = lazy(() => import("../pages/admin/SingleFoodCourtDetails"));

const AdminRoutes = () => (
  <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
    <Route element={<AdminLayout />}>
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/all-users" element={<AllUsers />} />
      <Route path="/admin/all-vendors" element={<AllVendors />} />
      <Route path="/admin/all-managers" element={<AllManagers />} />
      <Route path="/admin/vendor/:id" element={<VendorDetails />} />
      <Route path="/admin/profile" element={<Profile />} />
      <Route path="/admin/food-courts" element={<AllFoodCourts />} />
      <Route
        path="/admin/food-courts/:id"
        element={<SingleFoodCourtDetails />}
      />
    </Route>
  </Route>
);

export default AdminRoutes;
