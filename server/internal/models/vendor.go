package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Vendor holds vendor-specific details separate from User
type Vendor struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID    primitive.ObjectID `bson:"user_id" json:"user_id" validate:"required"`
	ShopName  string             `bson:"shopName" json:"shopName" validate:"required,min=2,max=100"`
	GST       string             `bson:"gst,omitempty" json:"gst,omitempty" validate:"omitempty,len=15"` // optional
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}
