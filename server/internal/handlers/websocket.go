package handlers

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
	myws "github.com/MohdMusaiyab/infybyte/server/internal/websocket"
	"github.com/gin-gonic/gin"
	gorillaws "github.com/gorilla/websocket"
)

const (
	writeWait = 10 * time.Second

	pongWait = 60 * time.Second

	pingPeriod = (pongWait * 9) / 10

	maxMessageSize = 512 * 1024
)

var upgrader = gorillaws.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		frontendURL := os.Getenv("FRONTEND_URL")

		if os.Getenv("GIN_MODE") == "release" {
			return origin == frontendURL
		}

		return true
	},
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
		log.Printf("🚫 WebSocket Auth Failed: %v", err)

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

	go h.writePump(conn, client)
	go h.readPump(conn, client)

}

func (h *WebSocketHandler) readPump(conn *gorillaws.Conn, client *myws.Client) {
	defer func() {

		h.Hub.Unregister <- client

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
			log.Printf("Read error for client %s: %v", client.ID, err)
			break
		}
	}
}

func (h *WebSocketHandler) writePump(conn *gorillaws.Conn, client *myws.Client) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()

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
