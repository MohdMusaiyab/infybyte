package routes

import (
	"github.com/MohdMusaiyab/infybyte/server/internal/handlers"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

func InitRoutes(router *gin.Engine, db *mongo.Database, wsHandler *handlers.WebSocketHandler) {
	v1 := router.Group("/api/v1")
	{
		// Auth routes
		AuthRoutes(v1, db)
		// Admin Routes
		AdminRoutes(v1, db)
		// Vendor Routes
		VendorRoutes(v1, db)
		// User Routes
		UserRoutes(v1, db)
		// Manager Routes
		ManagerRoutes(v1, db)
		
		// WebSocket route under API v1
		v1.GET("/ws", wsHandler.HandleWebSocket)
	}
}