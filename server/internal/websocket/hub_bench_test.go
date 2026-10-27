package websocket

import (
	"fmt"
	"io"
	"log"
	"testing"
	"time"
)

// BenchmarkHub_Broadcast benchmarks message fan-out across varying numbers of concurrent clients.
func BenchmarkHub_Broadcast_100Clients(b *testing.B) {
	benchmarkHubBroadcast(b, 100)
}

func BenchmarkHub_Broadcast_500Clients(b *testing.B) {
	benchmarkHubBroadcast(b, 500)
}

func BenchmarkHub_Broadcast_1000Clients(b *testing.B) {
	benchmarkHubBroadcast(b, 1000)
}

func BenchmarkHub_Broadcast_5000Clients(b *testing.B) {
	benchmarkHubBroadcast(b, 5000)
}

func benchmarkHubBroadcast(b *testing.B, numClients int) {
	log.SetOutput(io.Discard)
	hub := NewHub()
	go hub.Run()

	clients := make([]*Client, numClients)
	for i := 0; i < numClients; i++ {
		clients[i] = NewClient(fmt.Sprintf("user-%d", i), "user")
		hub.Register <- clients[i]
		// Drain client send channels continuously so buffers don't overflow
		go func(c *Client) {
			for range c.Send {
			}
		}(clients[i])
	}

	// Wait until all clients are registered
	deadline := time.Now().Add(5 * time.Second)
	for hub.GetConnectedClientsCount() < numClients && time.Now().Before(deadline) {
		time.Sleep(1 * time.Millisecond)
	}

	msg := []byte(`{"type":"foodcourt_update","payload":{"id":"fc-123","status":"active"}}`)

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		hub.Broadcast <- msg
	}
}

// BenchmarkHub_TopicRouting benchmarks targeted topic dispatch across rooms.
func BenchmarkHub_TopicRouting_1000Clients(b *testing.B) {
	log.SetOutput(io.Discard)
	hub := NewHub()
	go hub.Run()

	numClients := 1000
	for i := 0; i < numClients; i++ {
		c := NewClient(fmt.Sprintf("user-%d", i), "user")
		hub.Register <- c
		// Half the clients subscribe to foodcourt:1, half to foodcourt:2
		topic := fmt.Sprintf("foodcourt:%d", (i%2)+1)
		hub.Subscribe <- Subscription{Client: c, Topic: topic}
		go func(cl *Client) {
			for range cl.Send {
			}
		}(c)
	}

	// Wait until all clients are registered
	deadline := time.Now().Add(5 * time.Second)
	for hub.GetConnectedClientsCount() < numClients && time.Now().Before(deadline) {
		time.Sleep(1 * time.Millisecond)
	}

	topicMsg := TopicMessage{
		Topic:   "foodcourt:1",
		Payload: []byte(`{"type":"item_update","payload":{"id":"item-456","price":150}}`),
	}

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		hub.BroadcastTopic <- topicMsg
	}
}

