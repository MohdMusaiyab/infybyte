package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/MohdMusaiyab/infybyte/server/config"
	"github.com/MohdMusaiyab/infybyte/server/internal/handlers"
	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
	"github.com/MohdMusaiyab/infybyte/server/internal/websocket"
	"github.com/MohdMusaiyab/infybyte/server/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {

	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found, relying on system environment variables")
	}

	utils.InitValidator()

	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
		log.Println("Setting Gin to Release Mode")
		if os.Getenv("ACCESS_SECRET") == "" || os.Getenv("REFRESH_SECRET") == "" {
			log.Fatal("CRITICAL: ACCESS_SECRET and REFRESH_SECRET must be configured in release mode")
		}
	}

	client := config.ConnectDB()
	dbName := os.Getenv("MONGO_DB_NAME")
	if dbName == "" {
		dbName = "infybyte"
	}
	db := client.Database(dbName)

	if err := config.EnsureIndexes(db); err != nil {
		log.Printf("⚠️  Error ensuring database indexes: %v\n", err)
	}

	wsHub := websocket.NewHub()
	go wsHub.Run()
	utils.SetWebSocketHub(wsHub)
	wsHandler := handlers.NewWebSocketHandler(wsHub)

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	frontendURL := os.Getenv("FRONTEND_URL")
	allowedOrigins := []string{}
	if frontendURL != "" {
		for _, o := range strings.Split(frontendURL, ",") {
			if trimmed := strings.TrimSpace(o); trimmed != "" {
				allowedOrigins = append(allowedOrigins, trimmed)
			}
		}
	}
	if os.Getenv("GIN_MODE") != "release" {
		devOrigins := []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"}
		for _, dev := range devOrigins {
			found := false
			for _, ao := range allowedOrigins {
				if ao == dev {
					found = true
					break
				}
			}
			if !found {
				allowedOrigins = append(allowedOrigins, dev)
			}
		}
	}

	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Authorization", "Content-Type", "Upgrade", "Connection", "Sec-WebSocket-Key", "Sec-WebSocket-Version", "Sec-WebSocket-Extensions"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		AllowWebSockets:  true,
		MaxAge:           12 * time.Hour,
	}))

	routes.InitRoutes(router, db, wsHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("🚀 Server running on port: %s\n", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Gracefully shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	if err := client.Disconnect(ctx); err != nil {
		log.Printf("Error disconnecting DB: %v", err)
	}

	log.Println("Server exiting")
}
