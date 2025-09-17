package routes

import (
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

// InitRoutes registers all routes in the app
func InitRoutes(router *gin.Engine, db *mongo.Database) {
	// Version grouping
	v1 := router.Group("/api/v1")
	{
		// Auth routes
		AuthRoutes(v1, db)

		// TODO: VendorRoutes(v1, db)
		// TODO: UserRoutes(v1, db)
		// TODO: FoodCourtRoutes(v1, db)
		// TODO: ItemRoutes(v1, db)
	}
}
