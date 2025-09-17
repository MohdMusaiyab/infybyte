package utils

import (
	"github.com/gin-gonic/gin"
)

type ApiResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Success response
func RespondSuccess(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, ApiResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Error response (no data field)
func RespondError(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, ApiResponse{
		Success: false,
		Message: message,
	})
}
