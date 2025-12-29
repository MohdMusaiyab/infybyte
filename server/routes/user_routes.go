package routes

import (
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/MohdMusaiyab/infybyte/server/internal/controllers"
	"github.com/MohdMusaiyab/infybyte/server/internal/middlewares"
)

func UserRoutes(router *gin.RouterGroup, db *mongo.Database) {
	user := router.Group("/user")
	user.Use(middlewares.AuthMiddleware())
	{
		user.GET("/profile", func(c *gin.Context) { controllers.GetUserProfile(c, db) })
		user.PUT("/profile", func(c *gin.Context) { controllers.UpdateUserProfile(c, db) })

		user.GET("/foodcourts", func(c *gin.Context) { controllers.GetAllFoodCourts(c, db) })
		user.GET("/foodcourts/:id", func(c *gin.Context) { controllers.GetFoodCourtByID(c, db) })
		user.GET("/foodcourts/:id/items", func(c *gin.Context) { controllers.GetFoodCourtItems(c, db) })

		user.GET("/vendors/:id", func(c *gin.Context) { controllers.GetVendorProfileByID(c, db) })
		user.GET("/vendors/:id/items", func(c *gin.Context) { controllers.GetVendorItemsWithFoodCourts(c, db) })

		user.GET("/items/:id", func(c *gin.Context) { controllers.GetItemDetails(c, db) })
	}
}
