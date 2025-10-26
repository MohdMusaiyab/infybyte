import { Route } from "react-router-dom";
import VendorLayout from "../layout/VendorLayout";
import VendorDashboard from "../pages/vendor/VendorDashboard";
import { PrivateRoute } from "../components/auth/ProtectedRoute";
import ItemsManagement from "../pages/vendor/ItemsManagement";
import CreateItem from "../pages/vendor/CreateItem";
import EditItem from "../pages/vendor/EditItem";
import ItemFoodCourt from "../pages/vendor/ItemFoodCourt";

const VendorRoutes = () => (
  <Route element={<PrivateRoute allowedRoles={["vendor"]} />}>
    <Route element={<VendorLayout />}>
      <Route path="/vendor/dashboard" element={<VendorDashboard />} />
      <Route path="/vendor/items-management" element={<ItemsManagement />} />
      <Route path="/vendor/items/create" element={<CreateItem />} />
      <Route path="/vendor/items/edit/:id" element={<EditItem />} />
      <Route path="/vendor/items/:id/foodcourts" element={<ItemFoodCourt />} />
      {/* Other vendor pages here */}
    </Route>
  </Route>
);

export default VendorRoutes;
