import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/routes";
import { useEffect, useState } from "react";
import { useAuthStore } from "./store/authStore";
import axios from "axios";

function App() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await axios.post(
          "http://localhost:8080/api/v1/auth/refresh",
          {},
          { withCredentials: true }
        );
        const { access_token, user } = res.data.data;
        setAuth(user, access_token);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setAuth, logout]);

  if (loading) return <div>Loading...</div>;
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
