import { createContext, useContext } from 'react';
import type { WebSocketMessage } from '../types/websocket';

export interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: unknown) => void;
  lastMessage: WebSocketMessage | null;
  disconnect: () => void;
  reconnect: () => void;
  reconnectAttempts: number;
}

export const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);
export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};