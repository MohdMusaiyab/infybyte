package routes

import (
	"github.com/MohdMusaiyab/infybyte/server/internal/controllers"
	"github.com/MohdMusaiyab/infybyte/server/internal/middlewares"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

func AuthRoutes(router *gin.RouterGroup, db *mongo.Database) {
	loginLimiter := middlewares.RateLimitMiddleware(5, 5.0/60.0)
	registerLimiter := middlewares.RateLimitMiddleware(3, 3.0/60.0)
	refreshLimiter := middlewares.RateLimitMiddleware(30, 30.0/60.0)

	auth := router.Group("/auth")
	{
		auth.POST("/register", registerLimiter, func(c *gin.Context) { controllers.Register(c, db) })
		auth.POST("/login", loginLimiter, func(c *gin.Context) { controllers.Login(c, db) })
		auth.POST("/refresh", refreshLimiter, func(c *gin.Context) { controllers.Refresh(c, db) })
		auth.POST("/logout", func(c *gin.Context) { controllers.Logout(c, db) })
	}
}
