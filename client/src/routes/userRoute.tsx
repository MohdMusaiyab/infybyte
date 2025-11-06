import { Route } from "react-router-dom";
import UserLayout from "../layout/UserLayout";
import UserDashboard from "../pages/user/UserDashboard";
import { PrivateRoute } from "../components/auth/ProtectedRoute";
import FoodCourtDetails from "../pages/user/FoodCourtDetails";
import FoodCourtVendors from "../pages/user/FoodCourtVendors";
import VendorProfile from "../pages/user/VendorProfile";
import VendorItemsAvailability from "../pages/user/VendorItemsAvailability";
import Profile from "../pages/user/Profile";

const UserRoutes = () => (
  <Route element={<PrivateRoute allowedRoles={["user"]} />}>
    <Route element={<UserLayout />}>
      <Route path="/user/dashboard" element={<UserDashboard />} />
      <Route path="/user/foodcourt/:id" element={<FoodCourtDetails/>} />
      <Route path="/user/foodcourt/:id/vendors" element={<FoodCourtVendors/>} />
      <Route path="/user/vendors/:id" element={<VendorProfile />} />
      <Route path="/user/vendors/:id/availability" element={<VendorItemsAvailability />} />
      <Route path="/user/profile" element={<Profile />} />
      {/*Other user pages here */}
    </Route>
  </Route>
);

export default UserRoutes;
