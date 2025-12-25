import { Route } from "react-router-dom";
import { PrivateRoute } from "../components/auth/ProtectedRoute";
import ManagerDashboard from "../pages/manager/ManagerDashboard";
import ManagerLayout from "../layout/ManagerLayout";
import SingleFoodCourt from "../pages/manager/SingleFoodCourt";
import SingleItemDetail from "../pages/manager/SingleItemDetail";
import ItemManagement from "../pages/manager/ItemManagement";
import MultipleItemManagement from "../pages/manager/MultipleItemManagement";
import Profile from "../pages/manager/Profile";
import ManagerFoodCourts from "../pages/manager/ManagerFoodCourts";

const ManagerRoutes = () => (
  <Route element={<PrivateRoute allowedRoles={["manager"]} />}>
    <Route element={<ManagerLayout />}>
      <Route path="/manager/dashboard" element={<ManagerDashboard />} />
      <Route path="/manager/food-courts" element={<ManagerFoodCourts />} />
      <Route path="/manager/food-courts/:foodCourtId" element={<SingleFoodCourt />} />
      <Route path="/manager/food-courts/:foodCourtId/items/:itemId" element={<SingleItemDetail />} /> 
       <Route path="/manager/item-management/:itemId" element={<ItemManagement />} /> 
       <Route path="/manager/item-management" element={<MultipleItemManagement />} /> 
       <Route path="/manager/profile" element={<Profile></Profile>}></Route>
       
    </Route>
  </Route>
);

export default ManagerRoutes;
