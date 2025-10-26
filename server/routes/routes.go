package routes

import (
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

func InitRoutes(router *gin.Engine, db *mongo.Database) {
	v1 := router.Group("/api/v1")
	{
		// Auth routes
		AuthRoutes(v1, db)
		//Admin Routes
		AdminRoutes(v1, db)
		// Vendor Routes
		VendorRoutes(v1, db)
		//User Routes
		UserRoutes(v1, db)

	}
}
