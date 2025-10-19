package routes

import (
	"github.com/MohdMusaiyab/infybyte/server/internal/controllers"
	"github.com/MohdMusaiyab/infybyte/server/internal/middlewares"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

// AdminRoutes defines all admin-only endpoints
func AdminRoutes(router *gin.RouterGroup, db *mongo.Database) {
	admin := router.Group("/admin")
	admin.Use(middlewares.AuthMiddleware(), middlewares.AdminMiddleware()) // ✅ Protect all admin routes
	{
		// User Management
		admin.GET("/users", func(c *gin.Context) { controllers.GetAllUsers(c, db) })
		admin.PUT("/users/:id/make-vendor", func(c *gin.Context) { controllers.MakeVendor(c, db) })
		admin.PUT("/users/:id/make-user", func(c *gin.Context) { controllers.MakeUser(c, db) })
		admin.DELETE("/users/:id", func(c *gin.Context) { controllers.DeleteUser(c, db) })

		// Vendor Management
		admin.GET("/vendors", func(c *gin.Context) { controllers.GetAllVendors(c, db) })
		admin.GET("/vendors/:id", func(c *gin.Context) { controllers.GetVendorDetails(c, db) })

		// Admin Profile
		admin.GET("/profile", func(c *gin.Context) { controllers.GetAdminProfile(c, db) })
		admin.PUT("/profile", func(c *gin.Context) { controllers.UpdateAdminProfile(c, db) })

		//Food Court Management
		admin.GET("/my-food-courts", func(c *gin.Context) { controllers.GetAllFoodCourtsAdmin(c, db) })
		admin.GET("/get-food-court-details/:foodCourtId", func(c *gin.Context) { controllers.GetFoodCourtDetailsAdmin(c, db) })
		admin.POST("/food-courts", func(c *gin.Context) { controllers.CreateFoodCourt(c, db) })
		admin.POST("/food-courts/:foodCourtId/add-vendor/:vendorId", func(c *gin.Context) { controllers.AddVendorToFoodCourt(c, db) })
		admin.DELETE("/food-courts/:foodCourtId/remove-vendor/:vendorId", func(c *gin.Context) { controllers.RemoveVendorFromFoodCourt(c, db) })
		admin.PUT("/food-courts/:foodCourtId", func(c *gin.Context) { controllers.UpdateFoodCourt(c, db) })
		admin.DELETE("/food-courts/:foodCourtId", func(c *gin.Context) { controllers.DeleteFoodCourt(c, db) })

		//Helper Like Vendor Drop Down
		admin.GET("/vendor-dropdown", func(c *gin.Context) { controllers.GetVendorDropdown(c, db) })
	}
}
