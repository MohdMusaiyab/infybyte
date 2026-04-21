package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/joho/godotenv"
)

func main() {
	// Try to load .env from current directory or parent directory
	_ = godotenv.Load()
	if os.Getenv("SERVER_URL") == "" {
		_ = godotenv.Load(filepath.Join("..", ".env"))
	}

	serverURL := os.Getenv("SERVER_URL")
	if serverURL == "" {
		log.Fatal("❌ SERVER_URL environment variable is not set. Please set it in .env or as an environment variable.")
	}

	// Default to 10 minutes, but allow override via environment variable
	interval := 10 * time.Minute
	if envInterval := os.Getenv("KEEP_ALIVE_INTERVAL"); envInterval != "" {
		if d, err := time.ParseDuration(envInterval); err == nil {
			interval = d
		}
	}

	log.Printf("🚀 Starting keep-alive script. Pinging %s every %v", serverURL, interval)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	// Perform an initial ping
	ping(serverURL)

	for range ticker.C {
		ping(serverURL)
	}
}

func ping(url string) {
	healthURL := fmt.Sprintf("%s/health", url)
	log.Printf("📡 Pinging %s...", healthURL)

	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	resp, err := client.Get(healthURL)
	if err != nil {
		log.Printf("❌ Error pinging %s: %v", healthURL, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		log.Printf("✅ Ping successful! Status: %d", resp.StatusCode)
	} else {
		log.Printf("⚠️  Ping returned non-200 status: %d", resp.StatusCode)
	}
}
