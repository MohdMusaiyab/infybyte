package websocket

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
)

type Client struct {
	ID        string
	UserID    string
	Role      string
	Send      chan []byte
	closeOnce sync.Once
	isClosed  bool
	closeMu   sync.RWMutex
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
		c.closeMu.Lock()
		c.isClosed = true
		c.closeMu.Unlock()
		close(c.Send)
	})
}

func (c *Client) IsClosed() bool {
	c.closeMu.RLock()
	defer c.closeMu.RUnlock()
	return c.isClosed
}
