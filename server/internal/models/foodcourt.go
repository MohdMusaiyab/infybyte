package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type FoodCourt struct {
	ID        primitive.ObjectID   `bson:"_id,omitempty" json:"id,omitempty"`
	Name      string               `bson:"name" json:"name" validate:"required,min=2,max=100"`
	Location  string               `bson:"location" json:"location" validate:"required"`
	AdminID   primitive.ObjectID   `bson:"admin_id" json:"admin_id" validate:"required"`
	VendorIDs []primitive.ObjectID `bson:"vendor_ids,omitempty" json:"vendor_ids,omitempty"`
	Timings   string               `bson:"timings,omitempty" json:"timings,omitempty" validate:"omitempty,max=100"`
	IsOpen    bool                 `bson:"isOpen" json:"isOpen"`
	Weekends  bool                 `bson:"weekends" json:"weekends"`
	Weekdays  bool                 `bson:"weekdays" json:"weekdays"`
	CreatedAt time.Time            `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time            `bson:"updatedAt" json:"updatedAt"`
}
