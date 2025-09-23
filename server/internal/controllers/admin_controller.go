package controllers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/MohdMusaiyab/infybyte/server/internal/models"
	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GetAllUsers(c *gin.Context, db *mongo.Database) {
	// pagination params
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "50")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 50
	}

	skip := (page - 1) * limit

	collection := db.Collection("users")

	// projection (exclude password)
	findOptions := options.Find().
		SetProjection(bson.M{
			"password": 0,
		}).
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"createdAt": -1})

	// fetch users
	cursor, err := collection.Find(context.TODO(), bson.M{}, findOptions)
	if err != nil {
		utils.RespondError(c, 500, "Failed to fetch users")
		return
	}
	defer cursor.Close(context.TODO())

	var users []models.User
	if err := cursor.All(context.TODO(), &users); err != nil {
		utils.RespondError(c, 500, "Error decoding users")
		return
	}

	// count total docs
	total, err := collection.CountDocuments(context.TODO(), bson.M{})
	if err != nil {
		utils.RespondError(c, 500, "Failed to count users")
		return
	}

	// response
	utils.RespondSuccess(c, 200, "Users fetched successfully", gin.H{
		"users": users,
		"meta": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

func MakeVendor(c *gin.Context, db *mongo.Database) {
	userID := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	usersCol := db.Collection("users")
	vendorsCol := db.Collection("vendors")

	// Find user
	var user models.User
	err = usersCol.FindOne(context.TODO(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	// If already vendor, return
	if user.Role == "vendor" {
		utils.RespondError(c, http.StatusConflict, "User is already a vendor")
		return
	}

	// Update role → vendor
	_, err = usersCol.UpdateOne(
		context.TODO(),
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"role": "vendor", "updatedAt": time.Now()}},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update user role")
		return
	}

	// Create vendor profile
	newVendor := models.Vendor{
		ID:        primitive.NewObjectID(),
		UserID:    user.ID,
		ShopName:  user.Name + "'s Shop", // default shop name
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = vendorsCol.InsertOne(context.TODO(), newVendor)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create vendor profile")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "User upgraded to vendor successfully", gin.H{
		"user_id":   user.ID,
		"new_role":  "vendor",
		"vendor_id": newVendor.ID,
	})
}

func MakeUser(c *gin.Context, db *mongo.Database) {
	userID := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	usersCol := db.Collection("users")
	vendorsCol := db.Collection("vendors")

	// Find user
	var user models.User
	err = usersCol.FindOne(context.TODO(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	// If already normal user
	if user.Role == "user" {
		utils.RespondError(c, http.StatusConflict, "User is already a normal user")
		return
	}

	// Update role → user
	_, err = usersCol.UpdateOne(
		context.TODO(),
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"role": "user", "updatedAt": time.Now()}},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update user role")
		return
	}

	// Remove vendor profile (optional: soft delete instead of hard delete)
	_, err = vendorsCol.DeleteOne(context.TODO(), bson.M{"userId": objID})
	if err != nil && err != mongo.ErrNoDocuments {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to remove vendor profile")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "User downgraded to normal user successfully", gin.H{
		"user_id":  user.ID,
		"new_role": "user",
	})
}

// Deleting a User and all the necessary information with it
func DeleteUser(c *gin.Context, db *mongo.Database) {
	userIDParam := c.Param("id")
	userID, err := primitive.ObjectIDFromHex(userIDParam)
	if err != nil {
		utils.RespondError(c, 400, "Invalid user ID")
		return
	}

	// Find the user
	var user models.User
	err = db.Collection("users").FindOne(context.TODO(), bson.M{"_id": userID}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		utils.RespondError(c, 404, "User not found")
		return
	} else if err != nil {
		utils.RespondError(c, 500, "Database error")
		return
	}

	// Cascade delete based on role
	switch user.Role {
	case "vendor":
		// Delete Vendor doc
		db.Collection("vendors").DeleteOne(context.TODO(), bson.M{"user_id": user.ID})

		// Find items by vendor
		itemCursor, _ := db.Collection("items").Find(context.TODO(), bson.M{"vendor_id": user.ID})
		var items []models.Item
		_ = itemCursor.All(context.TODO(), &items)

		// Delete items + mappings
		for _, item := range items {
			db.Collection("itemfoodcourts").DeleteMany(context.TODO(), bson.M{"item_id": item.ID})
			db.Collection("items").DeleteOne(context.TODO(), bson.M{"_id": item.ID})
		}

		// Remove vendor ID from foodcourts
		db.Collection("foodcourts").UpdateMany(
			context.TODO(),
			bson.M{"vendor_ids": user.ID},
			bson.M{"$pull": bson.M{"vendor_ids": user.ID}},
		)

		// Delete managers linked to vendor
		db.Collection("managers").DeleteMany(context.TODO(), bson.M{"vendor_id": user.ID})

	case "admin":
		// Find all foodcourts by this admin
		fcCursor, _ := db.Collection("foodcourts").Find(context.TODO(), bson.M{"admin_id": user.ID})
		var foodcourts []models.FoodCourt
		_ = fcCursor.All(context.TODO(), &foodcourts)

		for _, fc := range foodcourts {
			// Delete item-foodcourt mappings
			db.Collection("itemfoodcourts").DeleteMany(context.TODO(), bson.M{"foodcourt_id": fc.ID})

			// Delete managers tied to this foodcourt
			db.Collection("managers").DeleteMany(context.TODO(), bson.M{"foodcourt_id": fc.ID})

			// Finally delete the foodcourt
			db.Collection("foodcourts").DeleteOne(context.TODO(), bson.M{"_id": fc.ID})
		}

	case "user":
		// No cascading yet, just delete
	}

	// Delete the user
	_, err = db.Collection("users").DeleteOne(context.TODO(), bson.M{"_id": user.ID})
	if err != nil {
		utils.RespondError(c, 500, "Failed to delete user")
		return
	}

	utils.RespondSuccess(c, 200, "User deleted successfully", gin.H{
		"id":    user.ID.Hex(),
		"email": user.Email,
		"role":  user.Role,
	})
}

func GetAdminProfile(c *gin.Context, db *mongo.Database) {
	// Extract admin ID from context (set by auth middleware)
	adminIDHex, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, 401, "Unauthorized")
		return
	}

	adminID, err := primitive.ObjectIDFromHex(adminIDHex.(string))
	if err != nil {
		utils.RespondError(c, 400, "Invalid admin ID")
		return
	}

	// Fetch admin user
	var admin models.User
	err = db.Collection("users").FindOne(context.TODO(), bson.M{"_id": adminID, "role": "admin"}).Decode(&admin)
	if err == mongo.ErrNoDocuments {
		utils.RespondError(c, 404, "Admin not found")
		return
	} else if err != nil {
		utils.RespondError(c, 500, "Database error")
		return
	}

	// Optionally fetch FoodCourts created by this admin
	cursor, _ := db.Collection("foodcourts").Find(context.TODO(), bson.M{"admin_id": admin.ID})
	var foodcourts []models.FoodCourt
	_ = cursor.All(context.TODO(), &foodcourts)

	// Prepare response
	var fcSummaries []gin.H
	for _, fc := range foodcourts {
		fcSummaries = append(fcSummaries, gin.H{
			"id":       fc.ID.Hex(),
			"name":     fc.Name,
			"location": fc.Location,
			"isOpen":   fc.IsOpen,
		})
	}

	utils.RespondSuccess(c, 200, "Admin profile fetched", gin.H{
		"id":         admin.ID.Hex(),
		"name":       admin.Name,
		"email":      admin.Email,
		"role":       admin.Role,
		"foodcourts": fcSummaries,
		"created_at": admin.CreatedAt,
		"updated_at": admin.UpdatedAt,
	})
}

func UpdateAdminProfile(c *gin.Context, db *mongo.Database) {
	// Extract admin ID from context
	adminIDHex, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, 401, "Unauthorized")
		return
	}

	adminID, err := primitive.ObjectIDFromHex(adminIDHex.(string))
	if err != nil {
		utils.RespondError(c, 400, "Invalid admin ID")
		return
	}

	// Bind request body
	var input struct {
		Name  string `json:"name" validate:"omitempty,min=2,max=50"`
		Email string `json:"email" validate:"omitempty,email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, 400, "Invalid request body")
		return
	}

	// Validate input fields
	if err := utils.Validate.Struct(input); err != nil {
		utils.RespondError(c, 400, err.Error())
		return
	}

	updateData := bson.M{"updatedAt": time.Now()}
	if input.Name != "" {
		updateData["name"] = input.Name
	}
	if input.Email != "" {
		// Check if email already exists for another user
		count, _ := db.Collection("users").CountDocuments(context.TODO(), bson.M{
			"email": input.Email,
			"_id":   bson.M{"$ne": adminID},
		})
		if count > 0 {
			utils.RespondError(c, 409, "Email already in use")
			return
		}
		updateData["email"] = input.Email
	}

	// Update admin in DB
	_, err = db.Collection("users").UpdateOne(
		context.TODO(),
		bson.M{"_id": adminID, "role": "admin"},
		bson.M{"$set": updateData},
	)
	if err != nil {
		utils.RespondError(c, 500, "Failed to update profile")
		return
	}

	utils.RespondSuccess(c, 200, "Admin profile updated successfully", nil)
}
