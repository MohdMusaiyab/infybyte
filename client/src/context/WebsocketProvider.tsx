import React, { useCallback, type ReactNode } from 'react';
import { useWebSocket } from '../hooks/useWebsocket';
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
    console.log('WebSocket message received:', message);
    
    switch (message.type) {
      case 'item_foodcourt_update':
        if (onItemFoodCourtUpdate && message.payload) {
          onItemFoodCourtUpdate(message.payload as ItemFoodCourtUpdatePayload, message.action);
        }
        break;
      default:
        console.log('Unknown message type:', message.type);
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