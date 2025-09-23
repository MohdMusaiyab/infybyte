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

		// Admin Profile
		admin.GET("/profile", func(c *gin.Context) { controllers.GetAdminProfile(c, db) })
		admin.PUT("/profile", func(c *gin.Context) { controllers.UpdateAdminProfile(c, db) })
	}
}
