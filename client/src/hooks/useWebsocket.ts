import { useEffect, useRef, useCallback, useState } from "react";
import { useAuthStore } from "../store/authStore";
import type { WebSocketMessage, WebSocketConfig } from "../types/websocket";

export const useWebSocket = (config?: WebSocketConfig) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const configRef = useRef(config);
  const isInternalCloseRef = useRef(false); // NEW: Track internal closes
  const { accessToken } = useAuthStore();

  // Update config ref when it changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();

    if (ws.current) {
      isInternalCloseRef.current = true; // Mark as intentional
      ws.current.close(1000, "Manual disconnect");
      ws.current = null;
      isInternalCloseRef.current = false; // Reset
    }

    setIsConnected(false);
    setReconnectAttempts(0);
  }, [clearReconnectTimeout]);

  const connect = useCallback(() => {
    clearReconnectTimeout(); // Ensure any pending reconnect is cancelled before a new connect

    if (!accessToken) {
      console.warn("No access token available for WebSocket connection");
      disconnect(); // Ensure previous state is cleaned up
      return;
    }

    // Fix: Clean up existing connection while marking it as an internal close
    if (ws.current) {
      // Mark as internal close before closing
      isInternalCloseRef.current = true;
      ws.current.close();
      ws.current = null; // Clear the ref immediately
      isInternalCloseRef.current = false; // Reset for the new connection
    }

    try {
      const apiBase = import.meta.env.VITE_API_URL!;
      const wsBase = apiBase.replace(/^http/, "ws");
      const wsUrl = `${wsBase}/ws?token=${accessToken}`;

      console.log("🔌 Connecting to WebSocket...", wsUrl);
      const newWs = new WebSocket(wsUrl);
      ws.current = newWs; // Assign the new instance

      newWs.onopen = () => {
        setIsConnected(true);
        setReconnectAttempts(0);
        console.log("✅ WebSocket connected successfully");
        configRef.current?.onOpen?.();
      };

      // Removed non-standard 'ping' listener

      newWs.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          configRef.current?.onMessage?.(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      newWs.onclose = (event) => {
        setIsConnected(false);
        console.log("❌ WebSocket disconnected:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        configRef.current?.onClose?.(event);

        // Policy Error (e.g., Auth failure) - Do not reconnect
        const isAuthError = event.code === 1008;

        // Only auto-reconnect if it wasn't a manual (1000) or internal disconnect
        // AND not a known Authorization error (1008).
        if (
          !isInternalCloseRef.current &&
          event.code !== 1000 &&
          !isAuthError
        ) {
          const maxReconnectAttempts =
            configRef.current?.maxReconnectAttempts || 5;

          setReconnectAttempts((prev) => {
            const nextAttempt = prev + 1;

            if (nextAttempt <= maxReconnectAttempts) {
              // Exponential Backoff calculation (capped at 30s)
              const timeout = Math.min(
                (configRef.current?.reconnectInterval || 1000) *
                  Math.pow(2, prev),
                30000
              );

              console.log(
                `🔄 Reconnecting in ${timeout}ms (attempt ${nextAttempt}/${maxReconnectAttempts})`
              );

              // Use window.setTimeout for proper typing with clearTimeout
              reconnectTimeoutRef.current = window.setTimeout(() => {
                connect();
              }, timeout) as unknown as number;
            } else {
              console.log("❌ Max reconnection attempts reached");
            }

            return nextAttempt;
          });
        } else if (isAuthError) {
          console.error(
            "🚫 WebSocket closed due to Policy/Auth Error (Code 1008). Stopping reconnect."
          );
        }
      };

      newWs.onerror = (error) => {
        console.error("💥 WebSocket error:", error);
        configRef.current?.onError?.(error);
      };
    } catch (error) {
      console.error("WebSocket connection failed:", error);
    }
  }, [accessToken, disconnect, clearReconnectTimeout]);

  const sendMessage = useCallback((message: unknown) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  // Effect to manage connection based on accessToken availability
  useEffect(() => {
    if (accessToken) {
      connect();
    } else {
      // Clean up if the token is lost
      disconnect();
    }

    // Cleanup function when the component unmounts or effect reruns
    return () => {
      disconnect();
    };
  }, [accessToken, connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    lastMessage,
    disconnect,
    reconnect: connect,
    reconnectAttempts,
  };
};
