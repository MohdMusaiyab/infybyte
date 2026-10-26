package websocket

import (
	"sync"
	"testing"
	"time"
)

func TestHub_DeadlockPreventionWithSlowClients(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	// Register 5 fast clients and 3 slow/blocked clients
	var fastClients []*Client
	for i := 0; i < 5; i++ {
		client := NewClient("user-fast", "user")
		hub.Register <- client
		fastClients = append(fastClients, client)
	}

	var slowClients []*Client
	for i := 0; i < 3; i++ {
		client := NewClient("user-slow", "user")
		// Fill client buffer completely so it is blocked
		for j := 0; j < 256; j++ {
			client.Send <- []byte("prefill")
		}
		hub.Register <- client
		slowClients = append(slowClients, client)
	}

	time.Sleep(50 * time.Millisecond)

	// Broadcast 10 messages rapidly.
	// If the deadlock bug was present (sending slow client to h.Unregister inside Run loop),
	// the hub would immediately hang on the first slow client.
	done := make(chan bool)
	go func() {
		for i := 0; i < 10; i++ {
			hub.Broadcast <- []byte("test-broadcast-message")
		}
		done <- true
	}()

	select {
	case <-done:
		// Succeeded without deadlock
	case <-time.After(1 * time.Second):
		t.Fatal("Deadlock detected in Hub.Broadcast with slow clients!")
	}

	time.Sleep(50 * time.Millisecond)

	// Verify fast clients received messages
	receivedCount := 0
	for _, c := range fastClients {
		select {
		case msg := <-c.Send:
			if string(msg) == "test-broadcast-message" {
				receivedCount++
			}
		default:
		}
	}

	if receivedCount == 0 {
		t.Errorf("Expected fast clients to receive broadcast messages")
	}
}

func TestHub_TopicRoomsAndTargetedBroadcast(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	clientA := NewClient("user-a", "user")
	clientB := NewClient("user-b", "user")
	hub.Register <- clientA
	hub.Register <- clientB

	time.Sleep(20 * time.Millisecond)

	// Subscribe Client A to "foodcourt:1"
	hub.SubscribeClient(clientA, "foodcourt:1")
	// Subscribe Client B to "foodcourt:2"
	hub.SubscribeClient(clientB, "foodcourt:2")

	time.Sleep(30 * time.Millisecond)

	// Drain any initial messages
drainLoop:
	for {
		select {
		case <-clientA.Send:
		case <-clientB.Send:
		default:
			break drainLoop
		}
	}

	// Broadcast only to "foodcourt:1"
	hub.BroadcastToTopic("foodcourt:1", []byte("update-fc-1"))

	time.Sleep(30 * time.Millisecond)

	// Client A should receive it
	select {
	case msg := <-clientA.Send:
		if string(msg) != "update-fc-1" {
			t.Errorf("Client A expected update-fc-1, got %s", string(msg))
		}
	default:
		t.Error("Client A should have received message for foodcourt:1")
	}

	// Client B should NOT receive it
	select {
	case msg := <-clientB.Send:
		t.Errorf("Client B should not have received foodcourt:1 message, got: %s", string(msg))
	default:
		// Correct
	}

	// Unregister client A and verify cleanup
	hub.Unregister <- clientA
	time.Sleep(30 * time.Millisecond)

	if !clientA.IsClosed() {
		t.Error("Client A send channel should be closed after unregister")
	}
}

func TestHub_ConcurrentAccessSafety(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	var wg sync.WaitGroup
	// Spin up 20 goroutines registering, unsubscribing, and reading client count
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			client := NewClient("user-concurrent", "user")
			hub.Register <- client
			hub.SubscribeClient(client, "test-topic")
			_ = hub.GetConnectedClientsCount()
			hub.UnsubscribeClient(client, "test-topic")
			hub.Unregister <- client
		}(i)
	}

	wg.Wait()
	time.Sleep(50 * time.Millisecond)
}
