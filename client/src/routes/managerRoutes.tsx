import { lazy } from "react";
import { Route } from "react-router-dom";
import { PrivateRoute } from "../components/auth/ProtectedRoute";
import ManagerLayout from "../layout/ManagerLayout";

const ManagerDashboard = lazy(() => import("../pages/manager/ManagerDashboard"));
const ManagerFoodCourts = lazy(() => import("../pages/manager/ManagerFoodCourts"));
const SingleFoodCourt = lazy(() => import("../pages/manager/SingleFoodCourt"));
const SingleItemDetail = lazy(() => import("../pages/manager/SingleItemDetail"));
const ItemManagement = lazy(() => import("../pages/manager/ItemManagement"));
const MultipleItemManagement = lazy(() => import("../pages/manager/MultipleItemManagement"));
const Profile = lazy(() => import("../pages/manager/Profile"));

const ManagerRoutes = () => (
  <Route element={<PrivateRoute allowedRoles={["manager"]} />}>
    <Route element={<ManagerLayout />}>
      <Route path="/manager/dashboard" element={<ManagerDashboard />} />
      <Route path="/manager/food-courts" element={<ManagerFoodCourts />} />
      <Route path="/manager/food-courts/:foodCourtId" element={<SingleFoodCourt />} />
      <Route path="/manager/food-courts/:foodCourtId/items/:itemId" element={<SingleItemDetail />} /> 
       <Route path="/manager/item-management/:itemId" element={<ItemManagement />} /> 
       <Route path="/manager/item-management" element={<MultipleItemManagement />} /> 
       <Route path="/manager/profile" element={<Profile />} />
    </Route>
  </Route>
);

export default ManagerRoutes;
