package routes

import (
	"net/http"

	"github.com/MohdMusaiyab/infybyte/server/internal/middlewares"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

func InitRoutes(router *gin.Engine, db *mongo.Database) {
	v1 := router.Group("/api/v1")
	{
		// Auth routes
		AuthRoutes(v1, db)
		v1.GET("/test", middlewares.AuthMiddleware(), func(c *gin.Context) {
			userID, _ := c.Get("userID")
			role, _ := c.Get("role")
			c.JSON(http.StatusOK, gin.H{
				"message": "Middleware works!",
				"userID":  userID,
				"role":    role,
			})
		})
	}
}
