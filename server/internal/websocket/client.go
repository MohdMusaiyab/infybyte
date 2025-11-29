package websocket

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
)

type Client struct {
	ID     string
	UserID string
	Role   string
	Send   chan []byte

	closeOnce sync.Once
}

func generateClientID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func NewClient(userID, role string) *Client {
	return &Client{
		ID:     generateClientID(),
		UserID: userID,
		Role:   role,
		Send:   make(chan []byte, 256),
	}
}

func (c *Client) SafeClose() {
	c.closeOnce.Do(func() {
		close(c.Send)
	})
}
