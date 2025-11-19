package routes

import (
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"

	// "github.com/MohdMusaiyab/infybyte/server/internal/controllers"
	"github.com/MohdMusaiyab/infybyte/server/internal/controllers"
	"github.com/MohdMusaiyab/infybyte/server/internal/middlewares"
)

// ManagerRoutes defines all manager-related routes
func ManagerRoutes(router *gin.RouterGroup, db *mongo.Database) {
	manager := router.Group("/manager")
	manager.Use(middlewares.AuthMiddleware(), middlewares.ManagerMiddleware())
	{
		manager.GET("/dashboard", func(c *gin.Context) { controllers.GetManagerDashboard(c, db) })
		manager.GET("/foodcourts/:id", func(c *gin.Context) { controllers.GetManagerFoodCourtWithItems(c, db) })
		manager.GET("/foodcourts/:id/items/:itemId", func(c *gin.Context) { controllers.GetManagerFoodCourtItem(c, db) })
		manager.PUT("/foodcourt/item/:itemId/status", func(c *gin.Context) { controllers.UpdateFoodCourtItemStatus(c, db) })
		manager.PUT("/foodcourt/item/:itemId", func(c *gin.Context) { controllers.UpdateFoodCourtItemByManager(c, db) })
	}
}
