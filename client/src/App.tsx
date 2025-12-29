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
      } catch  {
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setAuth, logout]);


  const handleItemFoodCourtUpdate = (
    update: ItemFoodCourtUpdatePayload,
    action: string
  ) => {
    console.log(`Real-time update: Item ${action}`, update);
  };

  return (
    <Router>
      {loading ? (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
           <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-black font-bold tracking-widest uppercase text-xs">Infybite</p>
        </div>
      ) : (
        <WebSocketProvider onItemFoodCourtUpdate={handleItemFoodCourtUpdate}>
          <AppRoutes />
        </WebSocketProvider>
      )}
    </Router>
  );
}

export default App;