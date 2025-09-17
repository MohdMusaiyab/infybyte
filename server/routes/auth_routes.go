package routes

import (
	"github.com/MohdMusaiyab/infybyte/server/internal/controllers"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

// AuthRoutes registers authentication routes
func AuthRoutes(router *gin.RouterGroup, db *mongo.Database) {
	auth := router.Group("/auth")
	{
		auth.POST("/register", func(c *gin.Context) { controllers.Register(c, db) })
		auth.POST("/login", func(c *gin.Context) { controllers.Login(c, db) })
		auth.POST("/refresh", func(c *gin.Context) { controllers.Refresh(c, db) })
		auth.POST("/logout", func(c *gin.Context) { controllers.Logout(c, db) })
	}
}
