package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
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

	utils.InitValidator()

	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found, relying on system environment variables")
	}

	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
		log.Println("Settng Gin to Release Mode")
	}

	client := config.ConnectDB()
	dbName := os.Getenv("MONGO_DB_NAME")
	if dbName == "" {
		dbName = "infybyte"
	}
	db := client.Database(dbName)

	wsHub := websocket.NewHub()
	go wsHub.Run()
	utils.SetWebSocketHub(wsHub)
	wsHandler := handlers.NewWebSocketHandler(wsHub)

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		log.Println("⚠️  FRONTEND_URL not set! CORS might fail in production.")
	}

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Authorization", "Content-Type", "Upgrade", "Connection", "Sec-WebSocket-Key", "Sec-WebSocket-Version", "Sec-WebSocket-Extensions"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		AllowWebSockets:  true,
		MaxAge:           12 * time.Hour,
	}))

	routes.InitRoutes(router, db, wsHandler)

	router.GET("/health", func(c *gin.Context) {
		utils.RespondSuccess(c, 200, "Server is running", map[string]interface{}{
			"websocket_clients": wsHub.GetConnectedClientsCount(),
			"status":            "healthy",
		})
	})

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
