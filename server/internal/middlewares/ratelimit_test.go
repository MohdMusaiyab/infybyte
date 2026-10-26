package middlewares

import (
	"testing"
	"time"
)

func TestIPRateLimiter(t *testing.T) {
	limiter := NewIPRateLimiter(3, 10.0) // 3 tokens capacity, 10 tokens per second refill

	ip1 := "192.168.1.1"
	ip2 := "192.168.1.2"

	// IP1 should be allowed 3 times
	if !limiter.Allow(ip1) {
		t.Errorf("Expected 1st request to be allowed")
	}
	if !limiter.Allow(ip1) {
		t.Errorf("Expected 2nd request to be allowed")
	}
	if !limiter.Allow(ip1) {
		t.Errorf("Expected 3rd request to be allowed")
	}

	// 4th request from IP1 should be blocked
	if limiter.Allow(ip1) {
		t.Errorf("Expected 4th request to be blocked")
	}

	// IP2 has independent capacity
	if !limiter.Allow(ip2) {
		t.Errorf("Expected IP2 request to be allowed independently")
	}

	// Wait 200ms to allow refill (at 10/s, 200ms gives ~2 tokens)
	time.Sleep(200 * time.Millisecond)

	if !limiter.Allow(ip1) {
		t.Errorf("Expected IP1 request to be allowed after token refill")
	}
}

