package main

import (
	"log"
	"os"
	"github.com/gin-contrib/cors"
	"github.com/MohdMusaiyab/infybyte/server/config"
	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
	"github.com/MohdMusaiyab/infybyte/server/routes"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load env variables
	utils.InitValidator()

	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found, relying on system environment variables")
	}

	// Connect to MongoDB
	client := config.ConnectDB()
	dbName := os.Getenv("MONGO_DB_NAME")
	if dbName == "" {
		dbName = "infybyte" // default database name
	}
	db := client.Database(dbName)

	// Initialize Gin
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // React dev server
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	routes.InitRoutes(router, db)
	// Health check route
	router.GET("/health", func(c *gin.Context) {
		utils.RespondSuccess(c, 200, "Server is running", nil)
	})
	// TODO: Register routes (e.g., routes.InitRoutes(router))

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("🚀 Server running on port:", port)
	router.Run(":" + port)
}
