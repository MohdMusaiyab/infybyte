package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User represents all types of users: admin, vendor, customer
type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name      string             `bson:"name" json:"name" validate:"required,min=2,max=50"`
	Email     string             `bson:"email" json:"email" validate:"required,email"`
	Password  string             `bson:"password" json:"password" validate:"required,min=6"` // hashed before save
	Role      string             `bson:"role" json:"role" validate:"required,oneof=admin vendor user manager"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// UserValidationMessages maps validator tags to friendly messages
var UserValidationMessages = map[string]string{
	"Name.required":     "Name is required",
	"Name.min":          "Name must be at least 2 characters",
	"Name.max":          "Name must be at most 50 characters",
	"Email.required":    "Email is required",
	"Email.email":       "Email must be valid",
	"Password.required": "Password is required",
	"Password.min":      "Password must be at least 6 characters",
	"Role.required":     "Role is required",
	"Role.oneof":        "Role must be either  vendor  or user",
}
