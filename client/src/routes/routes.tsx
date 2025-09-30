import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Unauthorized from "../pages/Unauthorized";
import { PublicRoute } from "../components/auth/PublicRoute";
import UserRoutes from "./userRoute";
import VendorRoutes from "./vendorRoutes";
import AdminRoutes from "./adminRoutes";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    {UserRoutes()}
    {VendorRoutes()}
    {AdminRoutes()}
    <Route path="/unauthorized" element={<Unauthorized />} />
  </Routes>
);

export default AppRoutes;
