package middlewares

import (
	"context"
	"net/http"
	"strings"

	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			utils.RespondError(c, http.StatusUnauthorized, "Missing or invalid Authorization header")
			c.Abort()
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := utils.ValidateToken(token, false)
		if err != nil {
			utils.RespondError(c, http.StatusUnauthorized, "Invalid or expired token")
			c.Abort()
			return
		}
		c.Set("userID", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func VendorMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "vendor" {
			utils.RespondError(c, http.StatusForbidden, "Access restricted to vendors only")
			c.Abort()
			return
		}
		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "admin" {
			utils.RespondError(c, http.StatusForbidden, "Access restricted to admins only")
			c.Abort()
			return
		}
		c.Next()
	}
}

func ManagerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "manager" {
			utils.RespondError(c, http.StatusForbidden, "Access restricted to managers only")
			c.Abort()
			return
		}
		c.Next()
	}
}

func ActiveManagerMiddleware(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			utils.RespondError(c, http.StatusUnauthorized, "User not authenticated")
			c.Abort()
			return
		}

		userObjID, err := primitive.ObjectIDFromHex(userID.(string))
		if err != nil {
			utils.RespondError(c, http.StatusBadRequest, "Invalid user ID")
			c.Abort()
			return
		}

		var manager struct {
			IsActive bool `bson:"isActive"`
		}

		err = db.Collection("managers").FindOne(context.Background(), bson.M{
			"user_id": userObjID,
		}).Decode(&manager)

		if err != nil {
			utils.RespondError(c, http.StatusNotFound, "Manager profile not found")
			c.Abort()
			return
		}

		if !manager.IsActive {
			utils.RespondError(c, http.StatusForbidden, "Inactive managers cannot perform this action")
			c.Abort()
			return
		}

		c.Next()
	}
}
