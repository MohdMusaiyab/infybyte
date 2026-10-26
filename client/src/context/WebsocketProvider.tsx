import React, { useCallback, type ReactNode } from 'react';
import axios from 'axios';
import { useWebSocket } from '../hooks/useWebsocket';
import { useAuthStore } from '../store/authStore';
import type { WebSocketMessage, ItemFoodCourtUpdatePayload } from '../types/websocket';
import { WebSocketContext } from './WebSocketContext';

interface WebSocketProviderProps {
  children: ReactNode;
  onItemFoodCourtUpdate?: (update: ItemFoodCourtUpdatePayload, action: string) => void;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  onItemFoodCourtUpdate 
}) => {
  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'item_foodcourt_update':
        if (onItemFoodCourtUpdate && message.payload) {
          onItemFoodCourtUpdate(message.payload as ItemFoodCourtUpdatePayload, message.action);
        }
        break;
      case 'role_change':
        axios
          .post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {}, { withCredentials: true })
          .then((res) => {
            const { access_token, user } = res.data.data;
            useAuthStore.getState().setAuth(user, access_token);
          })
          .catch(() => {});
        break;
      default:
        break;
    }
  }, [onItemFoodCourtUpdate]);

  const webSocket = useWebSocket({
    onMessage: handleMessage,
    onOpen: () => console.log('🔌 WebSocket connected'),
    onClose: (event) => console.log('🔌 WebSocket disconnected:', event.reason),
    onError: (error) => console.error('🔌 WebSocket error:', error),
    maxReconnectAttempts: 5,
    reconnectInterval: 1000
  });

  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  );
};