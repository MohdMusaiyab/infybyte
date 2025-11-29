package handlers

import (
    "log"
    "net/http"
    "time"

    "github.com/MohdMusaiyab/infybyte/server/internal/utils"
    myws "github.com/MohdMusaiyab/infybyte/server/internal/websocket"
    "github.com/gin-gonic/gin"
    gorillaws "github.com/gorilla/websocket"
)

const (
    // Time allowed to write a message to the peer
    writeWait = 10 * time.Second

    // Time allowed to read the next pong message from the peer
    pongWait = 60 * time.Second

    // Send pings to peer with this period (must be less than pongWait)
    pingPeriod = (pongWait * 9) / 10

    // Maximum message size allowed from peer
    maxMessageSize = 512 * 1024 // 512KB
)

var upgrader = gorillaws.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        // Warning: This should be restricted in production
        return true 
    },
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}

type WebSocketHandler struct {
    Hub *myws.Hub
}

func NewWebSocketHandler(hub *myws.Hub) *WebSocketHandler {
    return &WebSocketHandler{Hub: hub}
}

func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
    token := c.Query("token")
    if token == "" {
        log.Println("🚫 WebSocket Auth Failed: Missing token") // Added logging
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Token required"})
        return
    }

    claims, err := utils.ValidateToken(token, false)
    if err != nil {
        log.Printf("🚫 WebSocket Auth Failed: %v", err) // Added logging
        // IMPORTANT: Returns HTTP 401, causing the client to stop retrying.
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"}) 
        return
    }

    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        log.Printf("WebSocket upgrade error: %v", err)
        return
    }

    client := myws.NewClient(claims.UserID, claims.Role)
    h.Hub.Register <- client

    log.Printf("✅ WebSocket connection established for user %s (role: %s)", claims.UserID, claims.Role)

    // Start goroutines for reading and writing
    go h.writePump(conn, client)
    go h.readPump(conn, client)
    
    // Note: The handler function must exit immediately after starting the pumps
    // to prevent blocking the Gin HTTP thread.
}

func (h *WebSocketHandler) readPump(conn *gorillaws.Conn, client *myws.Client) {
    defer func() {
        // Unregister the client (hub will SafeClose the client's Send)
        h.Hub.Unregister <- client

        // Send normal close frame before closing underlying connection if possible.
        // Try to write a close control frame; ignore error (connection might be already closed).
        _ = conn.WriteMessage(gorillaws.CloseMessage, gorillaws.FormatCloseMessage(gorillaws.CloseNormalClosure, ""))

        conn.Close()
        log.Printf("❌ WebSocket closed for user %s", client.ID)
    }()

    conn.SetReadLimit(maxMessageSize)
    conn.SetReadDeadline(time.Now().Add(pongWait))
    conn.SetPongHandler(func(string) error {
        conn.SetReadDeadline(time.Now().Add(pongWait))
        return nil
    })

    for {
        _, _, err := conn.ReadMessage()
        if err != nil {
            // Log every read error (not only unexpected close)
            log.Printf("Read error for client %s: %v", client.ID, err)
            break
        }
    }
}

func (h *WebSocketHandler) writePump(conn *gorillaws.Conn, client *myws.Client) {
    ticker := time.NewTicker(pingPeriod)
    defer func() {
        ticker.Stop()
        // try send close if not already
        _ = conn.WriteMessage(gorillaws.CloseMessage, gorillaws.FormatCloseMessage(gorillaws.CloseNormalClosure, ""))
        conn.Close()
        log.Printf("writePump exited for client %s", client.ID)
    }()

    for {
        select {
        case message, ok := <-client.Send:
            conn.SetWriteDeadline(time.Now().Add(writeWait))
            if !ok {
                log.Printf("client.Send closed for %s — sending close frame", client.ID)
                // Hub closed channel -> send close and exit
                _ = conn.WriteMessage(gorillaws.CloseMessage, gorillaws.FormatCloseMessage(gorillaws.CloseNormalClosure, ""))
                return
            }

            if err := conn.WriteMessage(gorillaws.TextMessage, message); err != nil {
                log.Printf("WriteMessage error for %s: %v", client.ID, err)
                return
            }

        case <-ticker.C:
            conn.SetWriteDeadline(time.Now().Add(writeWait))
            if err := conn.WriteMessage(gorillaws.PingMessage, nil); err != nil {
                log.Printf("Ping error for %s: %v", client.ID, err)
                return
            }
        }
    }
}
