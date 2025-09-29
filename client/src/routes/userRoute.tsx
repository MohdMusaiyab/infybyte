import { Route } from "react-router-dom";
import UserLayout from "../layout/UserLayout";
import UserDashboard from "../pages/user/UserDashboard";
import { PrivateRoute } from "../components/auth/ProtectedRoute";

const UserRoutes = () => (
  <Route element={<PrivateRoute allowedRoles={["user"]} />}>
    <Route element={<UserLayout />}>
      <Route path="/user/dashboard" element={<UserDashboard />} />
      {/*Other user pages here */}
    </Route>
  </Route>
);

export default UserRoutes;
