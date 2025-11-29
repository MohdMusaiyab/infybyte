package websocket

import (
	"log"
	"sync"
)

type Hub struct {
	Clients    map[*Client]bool
	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
	mutex      sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan []byte),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Clients:    make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {

		case client := <-h.Register:
			h.mutex.Lock()
			h.Clients[client] = true
			h.mutex.Unlock()
			log.Printf("WebSocket client registered: %s (User: %s, Role: %s)", client.ID, client.UserID, client.Role)

		case client := <-h.Unregister:
			h.mutex.Lock()
			if _, exists := h.Clients[client]; exists {
				delete(h.Clients, client)
				client.SafeClose() // Close only here
			}
			h.mutex.Unlock()
			log.Printf("WebSocket client unregistered: %s", client.ID)

		case message := <-h.Broadcast:
			// Safe broadcast
			h.mutex.RLock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
					// sent successfully
				default:
					// buffer full → unregister the client
					log.Printf("Removing slow client: %s", client.ID)
					h.mutex.RUnlock()        // Unlock before modifying maps
					h.Unregister <- client   // ALWAYS unregister, never close directly
					h.mutex.RLock()          // Re-acquire read lock
				}
			}
			h.mutex.RUnlock()
		}
	}
}

// Utility: get online client count
func (h *Hub) GetConnectedClientsCount() int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	return len(h.Clients)
}
