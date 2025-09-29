import { Route } from "react-router-dom";
import VendorLayout from "../layout/VendorLayout";
import VendorDashboard from "../pages/vendor/VendorDashboard";
import { PrivateRoute } from "../components/auth/ProtectedRoute";

const VendorRoutes = () => (
  <Route element={<PrivateRoute allowedRoles={["vendor"]} />}>
    <Route element={<VendorLayout />}>
      <Route path="/vendor/dashboard" element={<VendorDashboard />} />
      {/* Other vendor pages here */}
    </Route>
  </Route>
);

export default VendorRoutes;
