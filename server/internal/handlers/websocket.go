package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
	myws "github.com/MohdMusaiyab/infybyte/server/internal/websocket"
	"github.com/gin-gonic/gin"
	gorillaws "github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024
)

type ClientCommand struct {
	Action string `json:"action"`
	Topic  string `json:"topic"`
}

func checkOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return os.Getenv("GIN_MODE") != "release"
	}

	u, err := url.Parse(origin)
	if err != nil {
		return false
	}

	if os.Getenv("GIN_MODE") != "release" {
		hostname := u.Hostname()
		if hostname == "localhost" || hostname == "127.0.0.1" || hostname == "::1" {
			return true
		}
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL != "" {
		origins := strings.Split(frontendURL, ",")
		for _, raw := range origins {
			raw = strings.TrimSpace(raw)
			if parsed, err := url.Parse(raw); err == nil {
				if strings.EqualFold(u.Host, parsed.Host) {
					return true
				}
			} else if strings.EqualFold(origin, raw) {
				return true
			}
		}
	}

	return false
}

var upgrader = gorillaws.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     checkOrigin,
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
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if token == "" {
		if cookieToken, err := c.Cookie("access_token"); err == nil && cookieToken != "" {
			token = cookieToken
		}
	}

	if token == "" {
		log.Println("🚫 WebSocket Auth Failed: Missing token")
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authentication token required"})
		return
	}

	claims, err := utils.ValidateToken(token, false)
	if err != nil || claims.UserID == "" {
		log.Printf("🚫 WebSocket Auth Failed: %v", err)
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := myws.NewClient(claims.UserID, claims.Role)
	h.Hub.Register <- client
	h.Hub.SubscribeClient(client, "user:"+claims.UserID)

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
		_, message, err := conn.ReadMessage()
		if err != nil {
			if gorillaws.IsUnexpectedCloseError(err, gorillaws.CloseGoingAway, gorillaws.CloseAbnormalClosure, gorillaws.CloseNormalClosure) {
				log.Printf("Read error for client %s: %v", client.ID, err)
			}
			break
		}

		var cmd ClientCommand
		if err := json.Unmarshal(message, &cmd); err == nil {
			switch cmd.Action {
			case "subscribe":
				if cmd.Topic != "" {
					// Security check: Clients can only subscribe to their own user:* channel, never another user's
					if strings.HasPrefix(cmd.Topic, "user:") && cmd.Topic != "user:"+client.UserID {
						log.Printf("⚠️ Blocked unauthorized subscription to topic %s by user %s", cmd.Topic, client.UserID)
						continue
					}
					h.Hub.SubscribeClient(client, cmd.Topic)
				}
			case "unsubscribe":
				if cmd.Topic != "" {
					if strings.HasPrefix(cmd.Topic, "user:") && cmd.Topic != "user:"+client.UserID {
						continue
					}
					h.Hub.UnsubscribeClient(client, cmd.Topic)
				}
			case "ping":
				_ = conn.WriteMessage(gorillaws.PongMessage, nil)
			}
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
