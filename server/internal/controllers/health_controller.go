package controllers

import (
	"context"
	"time"

	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

// HealthCheck handles the health check request and pings the database
func HealthCheck(c *gin.Context, db *mongo.Database) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	// Ping the database to ensure the connection is active
	err := db.Client().Ping(ctx, nil)
	if err != nil {
		utils.RespondError(c, 500, "Database connection failed")
		return
	}

	utils.RespondSuccess(c, 200, "Server and Database are active", map[string]string{
		"status":   "healthy",
		"database": "connected",
	})
}
