package main

import (
	"log"
	"os"

	"github.com/MohdMusaiyab/infybyte/server/config"
	"github.com/MohdMusaiyab/infybyte/server/internal/handlers"
	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
	"github.com/MohdMusaiyab/infybyte/server/internal/websocket" // or your actual path
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

	client := config.ConnectDB()
	dbName := os.Getenv("MONGO_DB_NAME")
	if dbName == "" {
		dbName = "infybyte"
	}
	db := client.Database(dbName)

	// Initialize WebSocket Hub
	wsHub := websocket.NewHub()
	go wsHub.Run()

	// Set the hub in utils for broadcasting
	utils.SetWebSocketHub(wsHub)

	// Initialize WebSocket Handler
	wsHandler := handlers.NewWebSocketHandler(wsHub)

	router := gin.Default()
	router.Use(cors.New(cors.Config{
	AllowOrigins:     []string{"http://localhost:5173"},
	AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
	AllowHeaders:     []string{"Origin", "Authorization", "Content-Type", "Upgrade", "Connection", "Sec-WebSocket-Key", "Sec-WebSocket-Version", "Sec-WebSocket-Extensions"},
	ExposeHeaders:    []string{"Content-Length"},
	AllowCredentials: true,
	AllowWebSockets:  true, 
}))

	routes.InitRoutes(router, db, wsHandler)

	router.GET("/health", func(c *gin.Context) {
		utils.RespondSuccess(c, 200, "Server is running", map[string]interface{}{
			"websocket_clients": wsHub.GetConnectedClientsCount(),
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("🚀 Server running on port:", port)
	log.Println("🔌 WebSocket endpoint available at /ws")
	router.Run(":" + port)
}
