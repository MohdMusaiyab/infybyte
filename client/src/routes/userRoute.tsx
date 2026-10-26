import { lazy } from "react";
import { Route } from "react-router-dom";
import UserLayout from "../layout/UserLayout";
import { PrivateRoute } from "../components/auth/ProtectedRoute";

const UserDashboard = lazy(() => import("../pages/user/UserDashboard"));
const FoodCourtDetails = lazy(() => import("../pages/user/FoodCourtDetails"));
const FoodCourtVendors = lazy(() => import("../pages/user/FoodCourtVendors"));
const VendorProfile = lazy(() => import("../pages/user/VendorProfile"));
const VendorItemsAvailability = lazy(() => import("../pages/user/VendorItemsAvailability"));
const Profile = lazy(() => import("../pages/user/Profile"));
const ItemDetails = lazy(() => import("../pages/user/ItemDetails"));

const UserRoutes = () => (
  <Route element={<PrivateRoute allowedRoles={["user", "admin"]} />}>
    <Route element={<UserLayout />}>
      <Route path="/user/dashboard" element={<UserDashboard />} />
      <Route path="/user/foodcourt/:id" element={<FoodCourtDetails />} />
      <Route
        path="/user/foodcourt/:id/vendors"
        element={<FoodCourtVendors />}
      />
      <Route path="/user/vendors/:id" element={<VendorProfile />} />
      <Route
        path="/user/vendors/:id/availability"
        element={<VendorItemsAvailability />}
      />
      <Route path="/user/profile" element={<Profile />} />
      <Route path="/user/item/:id" element={<ItemDetails />} />
    </Route>
  </Route>
);

export default UserRoutes;
