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
import NotFound from "../pages/general/NotFound";
import { PrivateRoute } from "../components/auth/ProtectedRoute";
import PrivacyPolicy from "../pages/general/PrivacyPolicy";
import TermsOfService from "../pages/general/TermsOfService";
import CookiePolicy from "../pages/general/CookiePolicy";

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
      <Route
      element={
        <PrivateRoute
          allowedRoles={["user", "admin", "vendor", "manager"]}
        />
      }
    >
      
    </Route>
    {UserRoutes()}
    {VendorRoutes()}
    {AdminRoutes()}
    {ManagerRoutes()}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
    <Route path="/unauthorized" element={<Unauthorized />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
