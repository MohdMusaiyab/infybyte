package middlewares

import (
	"net/http"
	"sync"
	"time"

	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
	"github.com/gin-gonic/gin"
)

type clientBucket struct {
	tokens     float64
	lastRefill time.Time
}

type IPRateLimiter struct {
	mu           sync.Mutex
	clients      map[string]*clientBucket
	capacity     float64
	refillRate   float64
	cleanupEvery time.Duration
}

func NewIPRateLimiter(capacity float64, refillRate float64) *IPRateLimiter {
	limiter := &IPRateLimiter{
		clients:      make(map[string]*clientBucket),
		capacity:     capacity,
		refillRate:   refillRate,
		cleanupEvery: 10 * time.Minute,
	}

	go limiter.cleanupLoop()
	return limiter
}

func (limiter *IPRateLimiter) cleanupLoop() {
	ticker := time.NewTicker(limiter.cleanupEvery)
	for range ticker.C {
		limiter.mu.Lock()
		now := time.Now()
		for ip, bucket := range limiter.clients {
			if now.Sub(bucket.lastRefill) > limiter.cleanupEvery {
				delete(limiter.clients, ip)
			}
		}
		limiter.mu.Unlock()
	}
}

func (limiter *IPRateLimiter) Allow(ip string) bool {
	limiter.mu.Lock()
	defer limiter.mu.Unlock()

	now := time.Now()
	bucket, exists := limiter.clients[ip]
	if !exists {
		limiter.clients[ip] = &clientBucket{
			tokens:     limiter.capacity - 1,
			lastRefill: now,
		}
		return true
	}

	elapsed := now.Sub(bucket.lastRefill).Seconds()
	bucket.tokens += elapsed * limiter.refillRate
	if bucket.tokens > limiter.capacity {
		bucket.tokens = limiter.capacity
	}
	bucket.lastRefill = now

	if bucket.tokens >= 1 {
		bucket.tokens -= 1
		return true
	}

	return false
}

func RateLimitMiddleware(capacity float64, refillRate float64) gin.HandlerFunc {
	limiter := NewIPRateLimiter(capacity, refillRate)
	return func(c *gin.Context) {
		ip := c.ClientIP()
		if !limiter.Allow(ip) {
			utils.RespondError(c, http.StatusTooManyRequests, "Too many requests. Please try again later.")
			c.Abort()
			return
		}
		c.Next()
	}
}

