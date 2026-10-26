package controllers

import (
	"context"
	"time"

	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

func HealthCheck(c *gin.Context, db *mongo.Database) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
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
