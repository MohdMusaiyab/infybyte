import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { PublicRoute } from "../components/auth/PublicRoute";
import { PrivateRoute } from "../components/auth/ProtectedRoute";
import UserRoutes from "./userRoute";
import VendorRoutes from "./vendorRoutes";
import AdminRoutes from "./adminRoutes";
import ManagerRoutes from "./managerRoutes";

const Home = lazy(() => import("../pages/general/Home"));
const Login = lazy(() => import("../pages/auth/Login"));
const Register = lazy(() => import("../pages/auth/Register"));
const DemoDashboard = lazy(() => import("../pages/general/DemoDashboard"));
const Unauthorized = lazy(() => import("../pages/auth/Unauthorized"));
const NotFound = lazy(() => import("../pages/general/NotFound"));
const PrivacyPolicy = lazy(() => import("../pages/general/PrivacyPolicy"));
const TermsOfService = lazy(() => import("../pages/general/TermsOfService"));
const CookiePolicy = lazy(() => import("../pages/general/CookiePolicy"));

const PageLoader = () => (
  <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
    <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-black font-bold tracking-widest uppercase text-xs">Infybite</p>
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/demo-dashboard" element={<DemoDashboard />} />
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
      />
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
  </Suspense>
);

export default AppRoutes;
