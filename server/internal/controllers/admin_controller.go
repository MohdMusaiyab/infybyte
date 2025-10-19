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
	searchEmail := c.Query("email") // New: search by email

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

	// Build filter query
	filter := bson.M{}
	if searchEmail != "" {
		// Case-insensitive partial match for email
		filter["email"] = bson.M{
			"$regex":   searchEmail,
			"$options": "i", // case-insensitive
		}
	}

	// projection (exclude password)
	findOptions := options.Find().
		SetProjection(bson.M{
			"password": 0,
		}).
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"createdAt": -1})

	// fetch users with filter
	cursor, err := collection.Find(context.TODO(), filter, findOptions)
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

	// count total docs with filter
	total, err := collection.CountDocuments(context.TODO(), filter)
	if err != nil {
		utils.RespondError(c, 500, "Failed to count users")
		return
	}

	// response
	utils.RespondSuccess(c, 200, "Users fetched successfully", gin.H{
		"users": users,
		"meta": gin.H{
			"page":   page,
			"limit":  limit,
			"total":  total,
			"pages":  (total + int64(limit) - 1) / int64(limit),
			"search": searchEmail, // Include search query in response
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

func GetAllVendors(c *gin.Context, db *mongo.Database) {
	// pagination params
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "50")
	searchEmail := c.Query("email") // search by email
	searchName := c.Query("name")   // search by name

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 50
	}

	skip := (page - 1) * limit

	usersCollection := db.Collection("users")
	vendorsCollection := db.Collection("vendors")

	// Build filter query - only fetch users with role "vendor"
	userFilter := bson.M{"role": "vendor"}

	// Add search filters if provided
	if searchEmail != "" || searchName != "" {
		andConditions := []bson.M{{"role": "vendor"}}

		if searchEmail != "" {
			andConditions = append(andConditions, bson.M{
				"email": bson.M{
					"$regex":   searchEmail,
					"$options": "i", // case-insensitive
				},
			})
		}

		if searchName != "" {
			andConditions = append(andConditions, bson.M{
				"name": bson.M{
					"$regex":   searchName,
					"$options": "i", // case-insensitive
				},
			})
		}

		userFilter = bson.M{"$and": andConditions}
	}

	// projection (exclude password)
	findOptions := options.Find().
		SetProjection(bson.M{
			"password": 0,
		}).
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"createdAt": -1})

	// fetch vendor users with filter
	cursor, err := usersCollection.Find(context.TODO(), userFilter, findOptions)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch vendors")
		return
	}
	defer cursor.Close(context.TODO())

	var vendorUsers []models.User
	if err := cursor.All(context.TODO(), &vendorUsers); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Error decoding vendors")
		return
	}

	// Fetch vendor profiles for additional info
	type VendorWithProfile struct {
		ID        string `json:"id"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		Role      string `json:"role"`
		ShopName  string `json:"shopName,omitempty"`
		VendorID  string `json:"vendorId,omitempty"`
		CreatedAt string `json:"createdAt"`
		UpdatedAt string `json:"updatedAt"`
	}

	var vendorsWithProfiles []VendorWithProfile

	for _, user := range vendorUsers {
		vendorData := VendorWithProfile{
			ID:        user.ID.Hex(),
			Name:      user.Name,
			Email:     user.Email,
			Role:      user.Role,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}

		// Try to fetch vendor profile
		var vendor models.Vendor
		err := vendorsCollection.FindOne(context.TODO(), bson.M{"userId": user.ID}).Decode(&vendor)
		if err == nil {
			vendorData.ShopName = vendor.ShopName
			vendorData.VendorID = vendor.ID.Hex()
		}

		vendorsWithProfiles = append(vendorsWithProfiles, vendorData)
	}

	// count total vendor docs with filter
	total, err := usersCollection.CountDocuments(context.TODO(), userFilter)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to count vendors")
		return
	}

	// response
	utils.RespondSuccess(c, http.StatusOK, "Vendors fetched successfully", gin.H{
		"vendors": vendorsWithProfiles,
		"meta": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"pages":       (total + int64(limit) - 1) / int64(limit),
			"searchEmail": searchEmail,
			"searchName":  searchName,
		},
	})
}

// GetVendorDetails fetches detailed information about a specific vendor
func GetVendorDetails(c *gin.Context, db *mongo.Database) {
	vendorID := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(vendorID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid vendor ID")
		return
	}

	usersCollection := db.Collection("users")
	vendorsCollection := db.Collection("vendors")
	itemsCollection := db.Collection("items")

	// Find user with vendor role
	var user models.User
	err = usersCollection.FindOne(context.TODO(), bson.M{"_id": objID, "role": "vendor"}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	} else if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Database error")
		return
	}

	// Find vendor profile
	var vendor models.Vendor
	err = vendorsCollection.FindOne(context.TODO(), bson.M{"userId": user.ID}).Decode(&vendor)
	if err != nil && err != mongo.ErrNoDocuments {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch vendor profile")
		return
	}

	// Count items by this vendor
	itemCount, _ := itemsCollection.CountDocuments(context.TODO(), bson.M{"vendor_id": user.ID})

	// Prepare response
	utils.RespondSuccess(c, http.StatusOK, "Vendor details fetched", gin.H{
		"id":        user.ID.Hex(),
		"name":      user.Name,
		"email":     user.Email,
		"role":      user.Role,
		"shopName":  vendor.ShopName,
		"vendorId":  vendor.ID.Hex(),
		"itemCount": itemCount,
		"createdAt": user.CreatedAt,
		"updatedAt": user.UpdatedAt,
	})
}

// Getting all the Food Courts With ALL Information, even the Private Information
func GetAllFoodCourtsAdmin(c *gin.Context, db *mongo.Database) {
	// extract adminID from context
	adminIDVal, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, 401, "Unauthorized: admin ID not found in context")
		return
	}

	adminIDStr, ok := adminIDVal.(string)
	if !ok || adminIDStr == "" {
		utils.RespondError(c, 400, "Invalid admin ID in context")
		return
	}

	adminObjID, err := primitive.ObjectIDFromHex(adminIDStr)
	if err != nil {
		utils.RespondError(c, 400, "Invalid admin ID format")
		return
	}

	// pagination and search params
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "50")
	searchName := c.Query("name") // optional search by name

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 50
	}
	skip := (page - 1) * limit

	collection := db.Collection("foodcourts")

	// build filter
	filter := bson.M{
		"admin_id": adminObjID, // must be ObjectID
	}

	if searchName != "" {
		filter["name"] = bson.M{
			"$regex":   searchName,
			"$options": "i",
		}
	}

	findOptions := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"createdAt": -1})

	cursor, err := collection.Find(context.TODO(), filter, findOptions)
	if err != nil {
		utils.RespondError(c, 500, "Failed to fetch food courts")
		return
	}
	defer cursor.Close(context.TODO())

	var foodCourts []models.FoodCourt
	if err := cursor.All(context.TODO(), &foodCourts); err != nil {
		utils.RespondError(c, 500, "Error decoding food courts")
		return
	}

	total, err := collection.CountDocuments(context.TODO(), filter)
	if err != nil {
		utils.RespondError(c, 500, "Failed to count food courts")
		return
	}

	utils.RespondSuccess(c, 200, "Food courts fetched successfully", gin.H{
		"foodcourts": foodCourts,
		"meta": gin.H{
			"page":   page,
			"limit":  limit,
			"total":  total,
			"pages":  (total + int64(limit) - 1) / int64(limit),
			"search": searchName,
		},
	})
}

// Creating the Food Court By Logged in Admin
func CreateFoodCourt(c *gin.Context, db *mongo.Database) {
	// extract adminID from context
	adminIDVal, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, 401, "Unauthorized: admin ID not found in context")
		return
	}

	adminIDStr, ok := adminIDVal.(string)
	if !ok || adminIDStr == "" {
		utils.RespondError(c, 400, "Invalid admin ID in context")
		return
	}

	adminObjID, err := primitive.ObjectIDFromHex(adminIDStr)
	if err != nil {
		utils.RespondError(c, 400, "Invalid admin ID format")
		return
	}

	// parse request body
	var foodCourt models.FoodCourt
	if err := c.ShouldBindJSON(&foodCourt); err != nil {
		utils.RespondError(c, 400, "Invalid request body")
		return
	}

	collection := db.Collection("foodcourts")

	// Check for duplicate name under same admin
	count, err := collection.CountDocuments(context.TODO(), bson.M{
		"name":     foodCourt.Name,
		"admin_id": adminObjID,
	})
	if err != nil {
		utils.RespondError(c, 500, "Failed to check for duplicate food court")
		return
	}
	if count > 0 {
		utils.RespondError(c, 400, "Food court with the same name already exists")
		return
	}

	// override admin ID & timestamps
	foodCourt.ID = primitive.NewObjectID()
	foodCourt.AdminID = adminObjID
	foodCourt.CreatedAt = time.Now()
	foodCourt.UpdatedAt = time.Now()

	// default flags
	if !foodCourt.Weekdays && !foodCourt.Weekends {
		foodCourt.Weekdays = true
		foodCourt.Weekends = true
	}

	_, err = collection.InsertOne(context.TODO(), foodCourt)
	if err != nil {
		utils.RespondError(c, 500, "Failed to create food court")
		return
	}

	utils.RespondSuccess(c, 201, "Food court created successfully", foodCourt)
}

// Adding Vendor to FC ===>  May Contain Bug, Need to Test
func AddVendorToFoodCourt(c *gin.Context, db *mongo.Database) {
	foodCourtIDStr := c.Param("foodCourtId")
	vendorIDStr := c.Param("vendorId")

	foodCourtID, err := primitive.ObjectIDFromHex(foodCourtIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid FoodCourt ID")
		return
	}
	vendorID, err := primitive.ObjectIDFromHex(vendorIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid Vendor ID")
		return
	}

	usersCol := db.Collection("users")
	vendorsCol := db.Collection("vendors")
	foodCourtsCol := db.Collection("foodcourts")

	// Check if vendor exists
	var vendor models.Vendor
	err = vendorsCol.FindOne(context.TODO(), bson.M{"_id": vendorID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Ensure user role is vendor
	var user models.User
	err = usersCol.FindOne(context.TODO(), bson.M{"_id": vendor.UserID}).Decode(&user)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Associated user not found")
		return
	}
	if user.Role != "vendor" {
		utils.RespondError(c, http.StatusBadRequest, "User is not a vendor")
		return
	}

	// Check if vendor already added to this food court
	count, err := foodCourtsCol.CountDocuments(context.TODO(), bson.M{
		"_id":        foodCourtID,
		"vendor_ids": vendorID,
	})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to check existing vendors")
		return
	}
	if count > 0 {
		utils.RespondError(c, http.StatusConflict, "Vendor already added to this food court")
		return
	}

	// Add vendor to FoodCourt
	_, err = foodCourtsCol.UpdateOne(
		context.TODO(),
		bson.M{"_id": foodCourtID},
		bson.M{
			"$push": bson.M{"vendor_ids": vendorID},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to add vendor to food court")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Vendor added to food court successfully", gin.H{
		"foodCourtId": foodCourtID,
		"vendorId":    vendorID,
	})
}

// For Removing a Vendor From a FC ==> Needs Testing From UI Side
func RemoveVendorFromFoodCourt(c *gin.Context, db *mongo.Database) {
	foodCourtIDStr := c.Param("foodCourtId")
	vendorIDStr := c.Param("vendorId")

	foodCourtID, err := primitive.ObjectIDFromHex(foodCourtIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid FoodCourt ID")
		return
	}

	vendorID, err := primitive.ObjectIDFromHex(vendorIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid Vendor ID")
		return
	}

	// Extract logged-in admin ID from context
	adminIDVal, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "Unauthorized: admin ID not found in context")
		return
	}
	adminIDStr, ok := adminIDVal.(string)
	if !ok || adminIDStr == "" {
		utils.RespondError(c, http.StatusBadRequest, "Invalid admin ID in context")
		return
	}
	adminObjID, err := primitive.ObjectIDFromHex(adminIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid admin ID format")
		return
	}

	foodCourtsCol := db.Collection("foodcourts")

	// Check if vendor exists in this food court and admin matches
	var foodCourt models.FoodCourt
	err = foodCourtsCol.FindOne(context.TODO(), bson.M{
		"_id":        foodCourtID,
		"admin_id":   adminObjID,
		"vendor_ids": vendorID,
	}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found in this food court or you are not the admin")
		return
	}

	// Remove vendor from vendor_ids array
	_, err = foodCourtsCol.UpdateOne(
		context.TODO(),
		bson.M{"_id": foodCourtID},
		bson.M{
			"$pull": bson.M{"vendor_ids": vendorID},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to remove vendor from food court")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Vendor removed from food court successfully", gin.H{
		"foodCourtId": foodCourtID,
		"vendorId":    vendorID,
	})
}

// For Updating Food Court Details by Admin ===> Needs Check
func UpdateFoodCourt(c *gin.Context, db *mongo.Database) {
	foodCourtIDStr := c.Param("foodCourtId")
	foodCourtID, err := primitive.ObjectIDFromHex(foodCourtIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid FoodCourt ID")
		return
	}

	// Extract logged-in admin ID from context
	adminIDVal, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "Unauthorized: admin ID not found in context")
		return
	}
	adminIDStr, ok := adminIDVal.(string)
	if !ok || adminIDStr == "" {
		utils.RespondError(c, http.StatusBadRequest, "Invalid admin ID in context")
		return
	}
	adminObjID, err := primitive.ObjectIDFromHex(adminIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid admin ID format")
		return
	}

	// Parse request body
	var updateData struct {
		Name     *string `json:"name,omitempty"`
		Location *string `json:"location,omitempty"`
		Timings  *string `json:"timings,omitempty"`
		Weekdays *bool   `json:"weekdays,omitempty"`
		Weekends *bool   `json:"weekends,omitempty"`
	}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	collection := db.Collection("foodcourts")

	// Check ownership
	var foodCourt models.FoodCourt
	err = collection.FindOne(context.TODO(), bson.M{"_id": foodCourtID, "admin_id": adminObjID}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found or you are not the admin")
		return
	}

	// Build update object
	update := bson.M{"updatedAt": time.Now()}
	if updateData.Name != nil {
		update["name"] = *updateData.Name
	}
	if updateData.Location != nil {
		update["location"] = *updateData.Location
	}
	if updateData.Timings != nil {
		update["timings"] = *updateData.Timings
	}
	if updateData.Weekdays != nil {
		update["weekdays"] = *updateData.Weekdays
	}
	if updateData.Weekends != nil {
		update["weekends"] = *updateData.Weekends
	}

	// Update document
	_, err = collection.UpdateOne(context.TODO(), bson.M{"_id": foodCourtID}, bson.M{"$set": update})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update food court")
		return
	}

	// Fetch updated food court
	err = collection.FindOne(context.TODO(), bson.M{"_id": foodCourtID}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch updated food court")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Food court updated successfully", foodCourt)
}

// Deleting a FOOD Court , Needs Checking
func DeleteFoodCourt(c *gin.Context, db *mongo.Database) {
	foodCourtIDStr := c.Param("foodCourtId")
	foodCourtID, err := primitive.ObjectIDFromHex(foodCourtIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid FoodCourt ID")
		return
	}

	// Extract logged-in admin ID
	adminIDVal, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "Unauthorized: admin ID not found")
		return
	}
	adminIDStr, ok := adminIDVal.(string)
	if !ok || adminIDStr == "" {
		utils.RespondError(c, http.StatusBadRequest, "Invalid admin ID in context")
		return
	}
	adminObjID, err := primitive.ObjectIDFromHex(adminIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid admin ID format")
		return
	}

	foodCourtsCol := db.Collection("foodcourts")
	itemFoodCourtCol := db.Collection("item_foodcourts")
	managersCol := db.Collection("managers")

	// Ensure food court exists and belongs to this admin
	var fc models.FoodCourt
	err = foodCourtsCol.FindOne(context.TODO(), bson.M{"_id": foodCourtID, "admin_id": adminObjID}).Decode(&fc)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found or you are not the admin")
		return
	}

	// Delete the food court
	_, err = foodCourtsCol.DeleteOne(context.TODO(), bson.M{"_id": foodCourtID})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete food court")
		return
	}

	// Remove all ItemFoodCourt references
	_, _ = itemFoodCourtCol.DeleteMany(context.TODO(), bson.M{"foodcourt_id": foodCourtID})

	// Remove all managers linked to this food court
	_, _ = managersCol.DeleteMany(context.TODO(), bson.M{"foodcourt_id": foodCourtID})

	utils.RespondSuccess(c, http.StatusOK, "Food court and all related references deleted successfully", nil)
}

func GetVendorDropdown(c *gin.Context, db *mongo.Database) {
	vendorsCol := db.Collection("vendors")
	usersCol := db.Collection("users")

	// Optional: only active vendors
	// For now, fetch all vendors whose associated user role is "vendor"
	cursor, err := vendorsCol.Find(context.TODO(), bson.M{})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch vendors")
		return
	}
	defer cursor.Close(context.TODO())

	type VendorDropdown struct {
		ID       primitive.ObjectID `json:"id"`
		ShopName string             `json:"shopName"`
		UserID   primitive.ObjectID `json:"userId"`
	}

	var vendors []VendorDropdown
	for cursor.Next(context.TODO()) {
		var v models.Vendor
		if err := cursor.Decode(&v); err != nil {
			continue
		}

		// Optional: check user role
		var user models.User
		err := usersCol.FindOne(context.TODO(), bson.M{"_id": v.UserID}).Decode(&user)
		if err != nil || user.Role != "vendor" {
			continue
		}

		vendors = append(vendors, VendorDropdown{
			ID:       v.ID,
			ShopName: v.ShopName,
			UserID:   v.UserID,
		})
	}

	utils.RespondSuccess(c, http.StatusOK, "Vendors fetched successfully", vendors)
}

// For Fetting a Single Food Court Information
func GetFoodCourtDetailsAdmin(c *gin.Context, db *mongo.Database) {
	foodCourtIDStr := c.Param("foodCourtId")
	foodCourtID, err := primitive.ObjectIDFromHex(foodCourtIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid FoodCourt ID")
		return
	}

	// Get logged-in admin ID from context
	adminIDVal, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "Unauthorized: admin ID not found in context")
		return
	}
	adminIDStr, ok := adminIDVal.(string)
	if !ok || adminIDStr == "" {
		utils.RespondError(c, http.StatusBadRequest, "Invalid admin ID in context")
		return
	}
	adminObjID, err := primitive.ObjectIDFromHex(adminIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid admin ID format")
		return
	}

	foodCourtsCol := db.Collection("foodcourts")
	vendorsCol := db.Collection("vendors")

	// Find food court owned by this admin
	var fc models.FoodCourt
	err = foodCourtsCol.FindOne(context.TODO(), bson.M{
		"_id":      foodCourtID,
		"admin_id": adminObjID,
	}).Decode(&fc)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found or you are not the admin")
		return
	}

	// If vendor_ids exist, fetch their basic info (name + id)
	var vendorList []bson.M
	if len(fc.VendorIDs) > 0 {
		cursor, err := vendorsCol.Find(
			context.TODO(),
			bson.M{"_id": bson.M{"$in": fc.VendorIDs}},
			options.Find().SetProjection(bson.M{
				"_id":       1,
				"shopName": 1,
			}),
		)
		if err != nil {
			utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch vendor details")
			return
		}
		defer cursor.Close(context.TODO())
		if err := cursor.All(context.TODO(), &vendorList); err != nil {
			utils.RespondError(c, http.StatusInternalServerError, "Error decoding vendor details")
			return
		}
	}

	// Final response with vendor info included
	utils.RespondSuccess(c, http.StatusOK, "Food court details fetched successfully", gin.H{
		"foodCourt": fc,
		"vendors":   vendorList,
	})
}
