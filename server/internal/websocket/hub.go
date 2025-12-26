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
				client.SafeClose()
			}
			h.mutex.Unlock()
			log.Printf("WebSocket client unregistered: %s", client.ID)

		case message := <-h.Broadcast:

			h.mutex.RLock()
			for client := range h.Clients {
				select {
				case client.Send <- message:

				default:

					log.Printf("Removing slow client: %s", client.ID)
					h.mutex.RUnlock()
					h.Unregister <- client
					h.mutex.RLock()
				}
			}
			h.mutex.RUnlock()
		}
	}
}

func (h *Hub) GetConnectedClientsCount() int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	return len(h.Clients)
}
