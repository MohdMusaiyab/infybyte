package middlewares

import (
	"net/http"
	"strings"

	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware ensures the user is logged in
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			utils.RespondError(c, http.StatusUnauthorized, "Missing or invalid Authorization header")
			c.Abort()
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := utils.ValidateToken(token, false) // false = access token
		if err != nil {
			utils.RespondError(c, http.StatusUnauthorized, "Invalid or expired token")
			c.Abort()
			return
		}

		// Store user info in context
		c.Set("userID", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// VendorMiddleware ensures the user is a vendor
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

// AdminMiddleware ensures the user is an admin (optional)
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
