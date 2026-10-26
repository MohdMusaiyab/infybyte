package handlers

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/MohdMusaiyab/infybyte/server/internal/websocket"
	"github.com/gin-gonic/gin"
)

func TestWebSocket_AuthenticationRequired(t *testing.T) {
	gin.SetMode(gin.TestMode)
	hub := websocket.NewHub()
	go hub.Run()

	handler := NewWebSocketHandler(hub)
	router := gin.New()
	router.GET("/ws", handler.HandleWebSocket)

	// Case 1: No token
	req := httptest.NewRequest("GET", "/ws", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for missing token, got %d", w.Code)
	}

	// Case 2: Invalid token
	reqInvalid := httptest.NewRequest("GET", "/ws?token=invalid.token.here", nil)
	wInvalid := httptest.NewRecorder()
	router.ServeHTTP(wInvalid, reqInvalid)
	if wInvalid.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for invalid token, got %d", wInvalid.Code)
	}
}

func TestWebSocket_OriginCheck(t *testing.T) {
	os.Setenv("GIN_MODE", "release")
	os.Setenv("FRONTEND_URL", "https://app.infybyte.com")
	defer func() {
		os.Unsetenv("GIN_MODE")
		os.Unsetenv("FRONTEND_URL")
	}()

	// Trusted origin
	reqAllowed := httptest.NewRequest("GET", "/ws", nil)
	reqAllowed.Header.Set("Origin", "https://app.infybyte.com")
	if !checkOrigin(reqAllowed) {
		t.Error("Expected origin https://app.infybyte.com to be allowed")
	}

	// Untrusted origin
	reqBlocked := httptest.NewRequest("GET", "/ws", nil)
	reqBlocked.Header.Set("Origin", "https://malicious-site.com")
	if checkOrigin(reqBlocked) {
		t.Error("Expected origin https://malicious-site.com to be rejected")
	}
}

