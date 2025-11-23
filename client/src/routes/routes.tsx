import { Routes, Route } from "react-router-dom";
import Home from "../pages/general/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Unauthorized from "../pages/auth/Unauthorized";
import { PublicRoute } from "../components/auth/PublicRoute";
import UserRoutes from "./userRoute";
import VendorRoutes from "./vendorRoutes";
import AdminRoutes from "./adminRoutes";
import ManagerRoutes from "./managerRoutes";
import DemoDashboard from "../pages/general/DemoDashboard";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/demo-dashboard" element={<DemoDashboard />}></Route>
    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      }
    />
    {UserRoutes()}
    {VendorRoutes()}
    {AdminRoutes()}
    {ManagerRoutes()}
    <Route path="/unauthorized" element={<Unauthorized />} />
  </Routes>
);

export default AppRoutes;
