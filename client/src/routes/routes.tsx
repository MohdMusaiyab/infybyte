import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Unauthorized from "../pages/Unauthorized";

import { PublicRoute } from "../components/auth/PublicRoute";

// Import role-specific routes
import UserRoutes from "./userRoute";
import VendorRoutes from "./vendorRoutes";
import AdminRoutes from "./adminRoutes";

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

    {/* Role-specific Routes */}
    {UserRoutes()}
    {VendorRoutes()}
    {AdminRoutes()}

    {/* Unauthorized page */}
    <Route path="/unauthorized" element={<Unauthorized />} />
  </Routes>
);

export default AppRoutes;
