import { lazy } from "react";
import { Route } from "react-router-dom";
import VendorLayout from "../layout/VendorLayout";
import { PrivateRoute } from "../components/auth/ProtectedRoute";

const VendorDashboard = lazy(() => import("../pages/vendor/VendorDashboard"));
const ItemsManagement = lazy(() => import("../pages/vendor/ItemsManagement"));
const CreateItem = lazy(() => import("../pages/vendor/CreateItem"));
const EditItem = lazy(() => import("../pages/vendor/EditItem"));
const ItemFoodCourt = lazy(() => import("../pages/vendor/ItemFoodCourt"));
const VendorManagers = lazy(() => import("../pages/vendor/VendorManagers"));
const CreateManager = lazy(() => import("../pages/vendor/CreateManager"));
const EditManager = lazy(() => import("../pages/vendor/EditManager"));
const FoodCourtItems = lazy(() => import("../pages/vendor/FoodCourtItems"));
const VendorFoodCourts = lazy(() => import("../pages/vendor/VendorFoodCourt"));
const Profile = lazy(() => import("../pages/user/Profile"));

const VendorRoutes = () => (
  <Route element={<PrivateRoute allowedRoles={["vendor"]} />}>
    <Route element={<VendorLayout />}>
      <Route path="/vendor/dashboard" element={<VendorDashboard />} />
      <Route path="/vendor/items-management" element={<ItemsManagement />} />
      <Route path="/vendor/items/create" element={<CreateItem />} />
      <Route path="/vendor/items/edit/:id" element={<EditItem />} />
      <Route path="/vendor/items/:id/foodcourts" element={<ItemFoodCourt />} />
      <Route path="/vendor/managers" element={<VendorManagers />} />
      <Route path="/vendor/managers/create" element={<CreateManager />} />
      <Route path="/vendor/managers/edit/:id" element={<EditManager />} />
      <Route path="/vendor/foodcourt/:foodCourtId/items" element={<FoodCourtItems />} />
      <Route path="/vendor/foodcourt" element={<VendorFoodCourts />} />
      <Route path="/vendor/profile" element={<Profile />} />
    </Route>
  </Route>
);

export default VendorRoutes;
