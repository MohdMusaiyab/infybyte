package routes

import (
	"github.com/MohdMusaiyab/infybyte/server/internal/controllers"
	"github.com/MohdMusaiyab/infybyte/server/internal/middlewares"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

func AdminRoutes(router *gin.RouterGroup, db *mongo.Database) {
	admin := router.Group("/admin")
	admin.Use(middlewares.AuthMiddleware(), middlewares.AdminMiddleware()) // ✅ Protect all admin routes
	{

		admin.GET("/users", func(c *gin.Context) { controllers.GetAllUsers(c, db) })
		admin.PUT("/users/:id/make-vendor", func(c *gin.Context) { controllers.MakeVendor(c, db) })
		admin.PUT("/users/:id/make-user", func(c *gin.Context) { controllers.MakeUser(c, db) })
		admin.DELETE("/users/:id", func(c *gin.Context) { controllers.DeleteUser(c, db) })

		admin.GET("/vendors", func(c *gin.Context) { controllers.GetAllVendors(c, db) })
		admin.GET("/vendors/:id", func(c *gin.Context) { controllers.GetVendorDetails(c, db) })
		admin.GET("/managers", func(c *gin.Context) { controllers.GetAllManagers(c, db) })
		admin.PATCH("/vendors/:id/status", func(c *gin.Context) { controllers.UpdateVendorStatus(c, db) })

		admin.GET("/profile", func(c *gin.Context) { controllers.GetAdminProfile(c, db) })
		admin.PUT("/profile", func(c *gin.Context) { controllers.UpdateAdminProfile(c, db) })
		admin.GET("/dashboard-stats", func(c *gin.Context) { controllers.GetAdminDashboardStats(c, db) })

		admin.GET("/my-food-courts", func(c *gin.Context) { controllers.GetAllFoodCourtsAdmin(c, db) })
		admin.GET("/get-food-court-details/:foodCourtId", func(c *gin.Context) { controllers.GetFoodCourtDetailsAdmin(c, db) })
		admin.POST("/food-courts", func(c *gin.Context) { controllers.CreateFoodCourt(c, db) })
		admin.POST("/food-courts/:foodCourtId/add-vendor/:vendorId", func(c *gin.Context) { controllers.AddVendorToFoodCourt(c, db) })
		admin.DELETE("/food-courts/:foodCourtId/remove-vendor/:vendorId", func(c *gin.Context) { controllers.RemoveVendorFromFoodCourt(c, db) })
		admin.PUT("/food-courts/:foodCourtId", func(c *gin.Context) { controllers.UpdateFoodCourt(c, db) })
		admin.DELETE("/food-courts/:foodCourtId", func(c *gin.Context) { controllers.DeleteFoodCourt(c, db) })

		admin.GET("/vendor-dropdown", func(c *gin.Context) { controllers.GetVendorDropdown(c, db) })
	}
}
