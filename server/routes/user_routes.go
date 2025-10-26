package routes

import (
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/MohdMusaiyab/infybyte/server/internal/controllers"
	"github.com/MohdMusaiyab/infybyte/server/internal/middlewares"
	// "github.com/MohdMusaiyab/infybyte/server/internal/controllers" // Uncomment when controllers are ready
)

// UserRoutes defines all user-related routes
func UserRoutes(router *gin.RouterGroup, db *mongo.Database) {
	user := router.Group("/user")
	user.Use(middlewares.AuthMiddleware())
	{
		user.GET("/profile", func(c *gin.Context) { controllers.GetUserProfile(c, db) })
		user.PUT("/profile", func(c *gin.Context) { controllers.UpdateUserProfile(c, db) })

		//Getting All the Food Courts
		user.GET("/foodcourts", func(c *gin.Context) { controllers.GetAllFoodCourts(c, db) })
		user.GET("/foodcourts/:id", func(c *gin.Context) { controllers.GetFoodCourtByID(c, db) })
		user.GET("/foodcourts/:id/items", func(c *gin.Context) { controllers.GetFoodCourtItems(c, db) })
		// Vendor browsing
		user.GET("/vendors/:id", func(c *gin.Context) { controllers.GetVendorProfileByID(c, db) })
		user.GET("/vendors/:id/items", func(c *gin.Context) { controllers.GetVendorItemsWithFoodCourts(c, db) })
	}
}
