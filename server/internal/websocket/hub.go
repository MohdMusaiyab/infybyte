package websocket

import (
	"log"
	"strings"
	"sync"
	"sync/atomic"
)

type TopicMessage struct {
	Topic   string
	Payload []byte
}

type Subscription struct {
	Client *Client
	Topic  string
}

type Hub struct {
	Clients        map[*Client]bool
	rooms          map[string]map[*Client]bool
	clientRooms    map[*Client]map[string]bool
	Broadcast      chan []byte
	BroadcastTopic chan TopicMessage
	Register       chan *Client
	Unregister     chan *Client
	Subscribe      chan Subscription
	Unsubscribe    chan Subscription
	mutex          sync.RWMutex
	clientCount    atomic.Int64
}

func NewHub() *Hub {
	return &Hub{
		Clients:        make(map[*Client]bool),
		rooms:          make(map[string]map[*Client]bool),
		clientRooms:    make(map[*Client]map[string]bool),
		Broadcast:      make(chan []byte, 1024),
		BroadcastTopic: make(chan TopicMessage, 1024),
		Register:       make(chan *Client, 256),
		Unregister:     make(chan *Client, 256),
		Subscribe:      make(chan Subscription, 256),
		Unsubscribe:    make(chan Subscription, 256),
	}
}

func (h *Hub) Run() {
	for {
		select {

		case client := <-h.Register:
			h.mutex.Lock()
			h.Clients[client] = true
			if h.clientRooms[client] == nil {
				h.clientRooms[client] = make(map[string]bool)
			}
			h.addToRoom(client, "all")
			h.clientCount.Add(1)
			h.mutex.Unlock()
			log.Printf("WebSocket client registered: %s (User: %s, Role: %s)", client.ID, client.UserID, client.Role)

		case client := <-h.Unregister:
			h.mutex.Lock()
			h.removeClient(client)
			h.mutex.Unlock()

		case sub := <-h.Subscribe:
			h.mutex.Lock()
			if h.Clients[sub.Client] && sub.Topic != "" {
				if !strings.HasPrefix(sub.Topic, "user:") && sub.Topic != "all" {
					if h.clientRooms[sub.Client]["all"] {
						h.removeFromRoom(sub.Client, "all")
					}
				}
				h.addToRoom(sub.Client, sub.Topic)
				log.Printf("Client %s subscribed to topic: %s", sub.Client.ID, sub.Topic)
			}
			h.mutex.Unlock()

		case sub := <-h.Unsubscribe:
			h.mutex.Lock()
			if h.Clients[sub.Client] && sub.Topic != "" {
				h.removeFromRoom(sub.Client, sub.Topic)
				if len(h.clientRooms[sub.Client]) == 0 {
					h.addToRoom(sub.Client, "all")
				}
				log.Printf("Client %s unsubscribed from topic: %s", sub.Client.ID, sub.Topic)
			}
			h.mutex.Unlock()

		case message := <-h.Broadcast:
			var slowClients []*Client
			h.mutex.RLock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					slowClients = append(slowClients, client)
				}
			}
			h.mutex.RUnlock()

			if len(slowClients) > 0 {
				h.mutex.Lock()
				for _, client := range slowClients {
					log.Printf("Removing slow client: %s", client.ID)
					h.removeClient(client)
				}
				h.mutex.Unlock()
			}

		case tm := <-h.BroadcastTopic:
			var slowClients []*Client
			h.mutex.RLock()
			targetClients := make(map[*Client]bool)
			if roomClients, ok := h.rooms[tm.Topic]; ok {
				for client := range roomClients {
					targetClients[client] = true
				}
			}
			if !strings.HasPrefix(tm.Topic, "user:") {
				if allClients, ok := h.rooms["all"]; ok {
					for client := range allClients {
						targetClients[client] = true
					}
				}
			}

			for client := range targetClients {
				select {
				case client.Send <- tm.Payload:
				default:
					slowClients = append(slowClients, client)
				}
			}
			h.mutex.RUnlock()

			if len(slowClients) > 0 {
				h.mutex.Lock()
				for _, client := range slowClients {
					log.Printf("Removing slow client on topic %s: %s", tm.Topic, client.ID)
					h.removeClient(client)
				}
				h.mutex.Unlock()
			}
		}
	}
}

func (h *Hub) addToRoom(client *Client, topic string) {
	if _, exists := h.rooms[topic]; !exists {
		h.rooms[topic] = make(map[*Client]bool)
	}
	h.rooms[topic][client] = true
	if h.clientRooms[client] == nil {
		h.clientRooms[client] = make(map[string]bool)
	}
	h.clientRooms[client][topic] = true
}

func (h *Hub) removeFromRoom(client *Client, topic string) {
	if roomClients, exists := h.rooms[topic]; exists {
		delete(roomClients, client)
		if len(roomClients) == 0 {
			delete(h.rooms, topic)
		}
	}
	if clientTopics, exists := h.clientRooms[client]; exists {
		delete(clientTopics, topic)
	}
}

func (h *Hub) removeClient(client *Client) {
	if _, exists := h.Clients[client]; exists {
		delete(h.Clients, client)
		h.clientCount.Add(-1)

		if clientTopics, exists := h.clientRooms[client]; exists {
			for topic := range clientTopics {
				if roomClients, ok := h.rooms[topic]; ok {
					delete(roomClients, client)
					if len(roomClients) == 0 {
						delete(h.rooms, topic)
					}
				}
			}
			delete(h.clientRooms, client)
		}

		client.SafeClose()
		log.Printf("WebSocket client unregistered: %s", client.ID)
	}
}

func (h *Hub) BroadcastToTopic(topic string, message []byte) {
	select {
	case h.BroadcastTopic <- TopicMessage{Topic: topic, Payload: message}:
	default:
		log.Printf("Warning: BroadcastTopic channel full, dropping message for topic: %s", topic)
	}
}

func (h *Hub) SubscribeClient(client *Client, topic string) {
	select {
	case h.Subscribe <- Subscription{Client: client, Topic: topic}:
	default:
		log.Printf("Warning: Subscribe channel full for client: %s", client.ID)
	}
}

func (h *Hub) UnsubscribeClient(client *Client, topic string) {
	select {
	case h.Unsubscribe <- Subscription{Client: client, Topic: topic}:
	default:
		log.Printf("Warning: Unsubscribe channel full for client: %s", client.ID)
	}
}

func (h *Hub) GetConnectedClientsCount() int {
	return int(h.clientCount.Load())
}
