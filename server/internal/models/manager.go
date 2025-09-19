package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Manager struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID      primitive.ObjectID `bson:"user_id" json:"user_id" validate:"required"`
	VendorID    primitive.ObjectID `bson:"vendor_id" json:"vendor_id" validate:"required"`
	FoodCourtID primitive.ObjectID `bson:"foodcourt_id" json:"foodcourt_id" validate:"required"`
	IsActive    bool               `bson:"isActive" json:"isActive"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}
