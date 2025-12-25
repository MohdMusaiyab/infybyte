package routes

import (
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/MohdMusaiyab/infybyte/server/internal/controllers"
	"github.com/MohdMusaiyab/infybyte/server/internal/middlewares"
)

// ManagerRoutes defines all manager-related routes
func ManagerRoutes(router *gin.RouterGroup, db *mongo.Database) {
	manager := router.Group("/manager")
	manager.Use(middlewares.AuthMiddleware(), middlewares.ManagerMiddleware())
	{
		// Read-only routes - accessible to all managers (active/inactive)
		manager.GET("/dashboard", func(c *gin.Context) { controllers.GetManagerDashboard(c, db) })
		manager.GET("/foodcourts", func(c *gin.Context) { controllers.GetManagerFoodCourts(c, db) })
		manager.GET("/foodcourts/:id", func(c *gin.Context) { controllers.GetManagerFoodCourtWithItems(c, db) })
		manager.GET("/foodcourts/:id/items/:itemId", func(c *gin.Context) { controllers.GetManagerFoodCourtItem(c, db) })
		manager.GET("/items/:itemId", func(c *gin.Context) { controllers.GetManagerItemWithFCAssignments(c, db) })
		manager.GET("/vendor-items", func(c *gin.Context) { controllers.GetVendorItemsForManager(c, db) })
		manager.GET("/profile", func(c *gin.Context) { controllers.GetManagerProfile(c, db) })

		// Mutation routes - only for active managers
		manager.PUT("/foodcourt/item/:itemId/status", middlewares.ActiveManagerMiddleware(db), func(c *gin.Context) { controllers.UpdateFoodCourtItemStatus(c, db) })
		manager.PUT("/foodcourt/item/:itemId", middlewares.ActiveManagerMiddleware(db), func(c *gin.Context) { controllers.UpdateFoodCourtItemByManager(c, db) })
		manager.POST("/items/:itemId/foodcourt", middlewares.ActiveManagerMiddleware(db), func(c *gin.Context) { controllers.AddItemToManagerFoodCourt(c, db) })
		manager.PUT("/items/:itemId/foodcourt", middlewares.ActiveManagerMiddleware(db), func(c *gin.Context) { controllers.UpdateItemInManagerFoodCourt(c, db) })
		manager.DELETE("/items/:itemId/foodcourt", middlewares.ActiveManagerMiddleware(db), func(c *gin.Context) { controllers.RemoveItemFromManagerFoodCourt(c, db) })
		manager.PUT("/profile", middlewares.ActiveManagerMiddleware(db), func(c *gin.Context) { controllers.UpdateManagerProfile(c, db) })
	}
}
