import { Route } from "react-router-dom";
import { PrivateRoute } from "../components/auth/ProtectedRoute";
import ManagerDashboard from "../pages/manager/ManagerDashboard";
import ManagerLayout from "../layout/ManagerLayout";
import SingleFoodCourt from "../pages/manager/SingleFoodCourt";
import SingleItemDetail from "../pages/manager/SingleItemDetail";

const ManagerRoutes = () => (
  <Route element={<PrivateRoute allowedRoles={["manager"]} />}>
    <Route element={<ManagerLayout />}>
      <Route path="/manager/dashboard" element={<ManagerDashboard />} />
      <Route path="/manager/food-courts/:foodCourtId" element={<SingleFoodCourt />} />
      <Route path="/manager/food-courts/:foodCourtId/items/:itemId" element={<SingleItemDetail />} />  
      {/* Other manager pages here */}
    </Route>
  </Route>
);

export default ManagerRoutes;
