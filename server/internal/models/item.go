package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Item created by a Vendor, can be linked to multiple FoodCourts
type Item struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name        string             `bson:"name" json:"name" validate:"required,min=2,max=100"`
	Description string             `bson:"description,omitempty" json:"description,omitempty" validate:"omitempty,max=500"`
	BasePrice   float64            `bson:"basePrice" json:"basePrice" validate:"required,gt=0"` // Default price
	Category    string             `bson:"category" json:"category" validate:"required,oneof=breakfast maincourse dessert beverage dosa northmeal paratha chinese combo"`
	IsVeg       bool               `bson:"isVeg" json:"isVeg"`
	IsSpecial   bool               `bson:"isSpecial" json:"isSpecial"`
	VendorID    primitive.ObjectID `bson:"vendor_id" json:"vendor_id" validate:"required"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}
