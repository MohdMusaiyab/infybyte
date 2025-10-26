package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ItemFoodCourt struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	ItemID      primitive.ObjectID `bson:"item_id" json:"item_id" validate:"required"`
	FoodCourtID primitive.ObjectID `bson:"foodcourt_id" json:"foodcourt_id" validate:"required"`
	Status      string             `bson:"status" json:"status" validate:"required,oneof=available notavailable sellingfast finishingsoon"`
	Price       *float64           `bson:"price,omitempty" json:"price,omitempty"` // Optional: different pricing per location
	IsActive    bool               `bson:"isActive" json:"isActive"`               // Can disable item in specific food court
	TimeSlot    string             `bson:"timeSlot" json:"timeSlot" validate:"required,oneof=breakfast lunch snacks dinner"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}
