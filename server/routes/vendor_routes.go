package routes

import (
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/MohdMusaiyab/infybyte/server/internal/controllers"
	"github.com/MohdMusaiyab/infybyte/server/internal/middlewares"
)

// VendorRoutes defines all vendor-related routes
func VendorRoutes(router *gin.RouterGroup, db *mongo.Database) {
	vendor := router.Group("/vendor")
	vendor.Use(middlewares.AuthMiddleware(), middlewares.VendorMiddleware())
	{
		// Vendor dashboard or profile routes
		vendor.GET("/profile", func(c *gin.Context) { controllers.GetVendorProfile(c, db) })
		vendor.PUT("/profile", func(c *gin.Context) { controllers.UpdateVendorProfile(c, db) })
		vendor.GET("/profile/:id", func(c *gin.Context) { controllers.GetVendorProfileByID(c, db) })

		//Dashboard Route
		vendor.GET("/dashboard", func(c *gin.Context) { controllers.GetVendorDashboardStats(c, db) })
		// In VendorRoutes function, add this line:
		vendor.GET("/foodcourts/:id/items", func(c *gin.Context) { controllers.SingleFoodCourtItems(c, db) })

		//Vendor Item Management
		vendor.GET("/items", func(c *gin.Context) { controllers.GetVendorItems(c, db) })
		vendor.POST("/items", func(c *gin.Context) { controllers.CreateItem(c, db) })
		vendor.GET("/items/:id", func(c *gin.Context) { controllers.GetVendorItem(c, db) })
		vendor.PUT("/items/:id", func(c *gin.Context) { controllers.UpdateItem(c, db) })
		vendor.DELETE("/items/:id", func(c *gin.Context) { controllers.DeleteItem(c, db) })
		//Vendor Food Court Management
		vendor.GET("/foodcourts", func(c *gin.Context) { controllers.GetVendorFoodCourts(c, db) })
		vendor.GET("/foodcourt-items", func(c *gin.Context) { controllers.GetVendorFoodCourtItems(c, db) })
		vendor.POST("/foodcourt-items", func(c *gin.Context) { controllers.CreateFoodCourtItem(c, db) })
		vendor.PUT("/foodcourt-items/:id", func(c *gin.Context) { controllers.UpdateFoodCourtItem(c, db) })
		vendor.DELETE("/foodcourt-items", func(c *gin.Context) { controllers.DeleteFoodCourtItem(c, db) })
		vendor.GET("/items/:id/foodcourts", func(c *gin.Context) { controllers.GetItemFoodCourts(c, db) })
		vendor.GET("/my-foodcourts", func(c *gin.Context) { controllers.GetVendorFoodCourtsForDisplay(c, db) })
		//Manager Routes
		vendor.GET("/managers", func(c *gin.Context) { controllers.GetVendorManagers(c, db) })
		vendor.POST("/managers", func(c *gin.Context) { controllers.AddManager(c, db) })
		vendor.PUT("/managers/:id", func(c *gin.Context) { controllers.UpdateManager(c, db) })
		vendor.DELETE("/managers/:id", func(c *gin.Context) { controllers.RemoveManager(c, db) })
		vendor.GET("/managers/:id", func(c *gin.Context) { controllers.GetVendorManager(c, db) })
		//Getting All Users for assigning manager role
		vendor.GET("/users", func(c *gin.Context) { controllers.GetAllUsersForManager(c, db) })
	}
}
