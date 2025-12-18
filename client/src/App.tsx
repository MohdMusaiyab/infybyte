import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/routes";
import { useEffect, useState } from "react";
import { useAuthStore } from "./store/authStore";
import axios from "axios";
import { WebSocketProvider } from "./context/WebsocketProvider";
import type { ItemFoodCourtUpdatePayload } from "./types/websocket";

function App() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const [loading, setLoading] = useState(true);

  const handleItemFoodCourtUpdate = (
    update: ItemFoodCourtUpdatePayload,
    action: string
  ) => {
    console.log(`Real-time update: Item ${action}`, update);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
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
    <WebSocketProvider onItemFoodCourtUpdate={handleItemFoodCourtUpdate}>
      <Router>
        <AppRoutes />
      </Router>
    </WebSocketProvider>
  );
}

export default App;
