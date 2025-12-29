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

	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "50")
	searchEmail := c.Query("email")

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

	filter := bson.M{}
	if searchEmail != "" {

		filter["email"] = bson.M{
			"$regex":   searchEmail,
			"$options": "i",
		}
	}

	findOptions := options.Find().
		SetProjection(bson.M{
			"password": 0,
		}).
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"createdAt": -1})

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

	total, err := collection.CountDocuments(context.TODO(), filter)
	if err != nil {
		utils.RespondError(c, 500, "Failed to count users")
		return
	}

	utils.RespondSuccess(c, 200, "Users fetched successfully", gin.H{
		"users": users,
		"meta": gin.H{
			"page":   page,
			"limit":  limit,
			"total":  total,
			"pages":  (total + int64(limit) - 1) / int64(limit),
			"search": searchEmail,
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

	var user models.User
	err = usersCol.FindOne(context.TODO(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	if user.Role == "vendor" {
		utils.RespondError(c, http.StatusConflict, "User is already a vendor")
		return
	}

	_, err = usersCol.UpdateOne(
		context.TODO(),
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"role": "vendor", "updatedAt": time.Now()}},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update user role")
		return
	}

	newVendor := models.Vendor{
		ID:        primitive.NewObjectID(),
		UserID:    user.ID,
		ShopName:  user.Name + "'s Shop",
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

	var user models.User
	err = usersCol.FindOne(context.TODO(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	if user.Role == "user" {
		utils.RespondError(c, http.StatusConflict, "User is already a normal user")
		return
	}

	_, err = usersCol.UpdateOne(
		context.TODO(),
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"role": "user", "updatedAt": time.Now()}},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update user role")
		return
	}

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

func DeleteUser(c *gin.Context, db *mongo.Database) {
	userIDParam := c.Param("id")
	userID, err := primitive.ObjectIDFromHex(userIDParam)
	if err != nil {
		utils.RespondError(c, 400, "Invalid user ID")
		return
	}

	var user models.User
	err = db.Collection("users").FindOne(context.TODO(), bson.M{"_id": userID}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		utils.RespondError(c, 404, "User not found")
		return
	} else if err != nil {
		utils.RespondError(c, 500, "Database error")
		return
	}

	switch user.Role {
	case "vendor":

		db.Collection("vendors").DeleteOne(context.TODO(), bson.M{"user_id": user.ID})

		itemCursor, _ := db.Collection("items").Find(context.TODO(), bson.M{"vendor_id": user.ID})
		var items []models.Item
		_ = itemCursor.All(context.TODO(), &items)

		for _, item := range items {
			db.Collection("itemfoodcourts").DeleteMany(context.TODO(), bson.M{"item_id": item.ID})
			db.Collection("items").DeleteOne(context.TODO(), bson.M{"_id": item.ID})
		}

		db.Collection("foodcourts").UpdateMany(
			context.TODO(),
			bson.M{"vendor_ids": user.ID},
			bson.M{"$pull": bson.M{"vendor_ids": user.ID}},
		)

		db.Collection("managers").DeleteMany(context.TODO(), bson.M{"vendor_id": user.ID})

	case "admin":

		fcCursor, _ := db.Collection("foodcourts").Find(context.TODO(), bson.M{"admin_id": user.ID})
		var foodcourts []models.FoodCourt
		_ = fcCursor.All(context.TODO(), &foodcourts)

		for _, fc := range foodcourts {

			db.Collection("itemfoodcourts").DeleteMany(context.TODO(), bson.M{"foodcourt_id": fc.ID})

			db.Collection("managers").DeleteMany(context.TODO(), bson.M{"foodcourt_id": fc.ID})

			db.Collection("foodcourts").DeleteOne(context.TODO(), bson.M{"_id": fc.ID})
		}

	case "user":

	}

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

	var admin models.User
	err = db.Collection("users").FindOne(context.TODO(), bson.M{"_id": adminID, "role": "admin"}).Decode(&admin)
	if err == mongo.ErrNoDocuments {
		utils.RespondError(c, 404, "Admin not found")
		return
	} else if err != nil {
		utils.RespondError(c, 500, "Database error")
		return
	}

	cursor, _ := db.Collection("foodcourts").Find(context.TODO(), bson.M{"admin_id": admin.ID})
	var foodcourts []models.FoodCourt
	_ = cursor.All(context.TODO(), &foodcourts)

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

	var input struct {
		Name  string `json:"name" validate:"omitempty,min=2,max=50"`
		Email string `json:"email" validate:"omitempty,email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, 400, "Invalid request body")
		return
	}

	if err := utils.Validate.Struct(input); err != nil {
		utils.RespondError(c, 400, err.Error())
		return
	}

	updateData := bson.M{"updatedAt": time.Now()}
	if input.Name != "" {
		updateData["name"] = input.Name
	}
	if input.Email != "" {

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

	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "50")
	searchEmail := c.Query("email")

	searchName := c.Query("name")

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

	userFilter := bson.M{"role": "vendor"}

	if searchEmail != "" || searchName != "" {
		andConditions := []bson.M{{"role": "vendor"}}

		if searchEmail != "" {
			andConditions = append(andConditions, bson.M{
				"email": bson.M{
					"$regex":   searchEmail,
					"$options": "i",
				},
			})
		}

		if searchName != "" {
			andConditions = append(andConditions, bson.M{
				"name": bson.M{
					"$regex":   searchName,
					"$options": "i",
				},
			})
		}

		userFilter = bson.M{"$and": andConditions}
	}

	findOptions := options.Find().
		SetProjection(bson.M{
			"password": 0,
		}).
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"createdAt": -1})

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

		var vendor models.Vendor
		err := vendorsCollection.FindOne(context.TODO(), bson.M{"userId": user.ID}).Decode(&vendor)
		if err == nil {
			vendorData.ShopName = vendor.ShopName
			vendorData.VendorID = vendor.ID.Hex()
		}

		vendorsWithProfiles = append(vendorsWithProfiles, vendorData)
	}

	total, err := usersCollection.CountDocuments(context.TODO(), userFilter)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to count vendors")
		return
	}

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

func GetVendorDetails(c *gin.Context, db *mongo.Database) {
	vendorID := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(vendorID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid vendor ID")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user models.User
	err = db.Collection("users").FindOne(ctx, bson.M{"_id": objID, "role": "vendor"}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			utils.RespondError(c, http.StatusNotFound, "Vendor user not found")
		} else {
			utils.RespondError(c, http.StatusInternalServerError, "Database error")
		}
		return
	}

	var vendor models.Vendor
	err = db.Collection("vendors").FindOne(ctx, bson.M{"user_id": user.ID}).Decode(&vendor)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			utils.RespondError(c, http.StatusNotFound, "Vendor profile not found for this user")
		} else {
			utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch profile")
		}
		return
	}

	itemCount, err := db.Collection("items").CountDocuments(ctx, bson.M{"vendor_id": vendor.ID})
	if err != nil {
		itemCount = 0
	}

	utils.RespondSuccess(c, http.StatusOK, "Vendor details fetched", gin.H{
		"id": user.ID.Hex(),

		"vendorId": vendor.ID.Hex(),

		"name":      user.Name,
		"email":     user.Email,
		"shopName":  vendor.ShopName,
		"itemCount": itemCount,
		"createdAt": user.CreatedAt,
		"updatedAt": user.UpdatedAt,
	})
}

func GetAllFoodCourtsAdmin(c *gin.Context, db *mongo.Database) {

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

	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "50")
	searchName := c.Query("name")

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

	filter := bson.M{
		"admin_id": adminObjID,
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

func CreateFoodCourt(c *gin.Context, db *mongo.Database) {

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

	var foodCourt models.FoodCourt
	if err := c.ShouldBindJSON(&foodCourt); err != nil {
		utils.RespondError(c, 400, "Invalid request body")
		return
	}

	collection := db.Collection("foodcourts")

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

	foodCourt.ID = primitive.NewObjectID()
	foodCourt.AdminID = adminObjID
	foodCourt.CreatedAt = time.Now()
	foodCourt.UpdatedAt = time.Now()

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

	var vendor models.Vendor
	err = vendorsCol.FindOne(context.TODO(), bson.M{"_id": vendorID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

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

func UpdateFoodCourt(c *gin.Context, db *mongo.Database) {
	foodCourtIDStr := c.Param("foodCourtId")
	foodCourtID, err := primitive.ObjectIDFromHex(foodCourtIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid FoodCourt ID")
		return
	}

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

	var foodCourt models.FoodCourt
	err = collection.FindOne(context.TODO(), bson.M{"_id": foodCourtID, "admin_id": adminObjID}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found or you are not the admin")
		return
	}

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

	_, err = collection.UpdateOne(context.TODO(), bson.M{"_id": foodCourtID}, bson.M{"$set": update})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update food court")
		return
	}

	err = collection.FindOne(context.TODO(), bson.M{"_id": foodCourtID}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch updated food court")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Food court updated successfully", foodCourt)
}

func DeleteFoodCourt(c *gin.Context, db *mongo.Database) {
	foodCourtIDStr := c.Param("foodCourtId")
	foodCourtID, err := primitive.ObjectIDFromHex(foodCourtIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid FoodCourt ID")
		return
	}

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

	var fc models.FoodCourt
	err = foodCourtsCol.FindOne(context.TODO(), bson.M{"_id": foodCourtID, "admin_id": adminObjID}).Decode(&fc)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found or you are not the admin")
		return
	}

	_, err = foodCourtsCol.DeleteOne(context.TODO(), bson.M{"_id": foodCourtID})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete food court")
		return
	}

	_, _ = itemFoodCourtCol.DeleteMany(context.TODO(), bson.M{"foodcourt_id": foodCourtID})

	_, _ = managersCol.DeleteMany(context.TODO(), bson.M{"foodcourt_id": foodCourtID})

	utils.RespondSuccess(c, http.StatusOK, "Food court and all related references deleted successfully", nil)
}

func GetVendorDropdown(c *gin.Context, db *mongo.Database) {
	vendorsCol := db.Collection("vendors")
	usersCol := db.Collection("users")

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

func GetFoodCourtDetailsAdmin(c *gin.Context, db *mongo.Database) {
	foodCourtIDStr := c.Param("foodCourtId")
	foodCourtID, err := primitive.ObjectIDFromHex(foodCourtIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid FoodCourt ID")
		return
	}

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

	var fc models.FoodCourt
	err = foodCourtsCol.FindOne(context.TODO(), bson.M{
		"_id":      foodCourtID,
		"admin_id": adminObjID,
	}).Decode(&fc)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found or you are not the admin")
		return
	}

	var vendorList []bson.M
	if len(fc.VendorIDs) > 0 {
		cursor, err := vendorsCol.Find(
			context.TODO(),
			bson.M{"_id": bson.M{"$in": fc.VendorIDs}},
			options.Find().SetProjection(bson.M{
				"_id":      1,
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

	utils.RespondSuccess(c, http.StatusOK, "Food court details fetched successfully", gin.H{
		"foodCourt": fc,
		"vendors":   vendorList,
	})
}

func GetAllManagers(c *gin.Context, db *mongo.Database) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "50")

	searchName := c.Query("name")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)
	if page < 1 {
		page = 1
	}
	skip := (page - 1) * limit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pipeline := []bson.M{

		{"$lookup": bson.M{
			"from":         "users",
			"localField":   "user_id",
			"foreignField": "_id",
			"as":           "user_info",
		}},
		{"$unwind": "$user_info"},

		{"$match": bson.M{
			"user_info.name": bson.M{"$regex": searchName, "$options": "i"},
		}},

		{"$lookup": bson.M{
			"from":         "foodcourts",
			"localField":   "foodcourt_id",
			"foreignField": "_id",
			"as":           "fc_info",
		}},
		{"$unwind": bson.M{"path": "$fc_info", "preserveNullAndEmptyArrays": true}},

		{"$lookup": bson.M{
			"from":         "vendors",
			"localField":   "vendor_id",
			"foreignField": "_id",
			"as":           "vendor_info",
		}},
		{"$unwind": bson.M{"path": "$vendor_info", "preserveNullAndEmptyArrays": true}},

		{"$project": bson.M{
			"id":        "$_id",
			"name":      "$user_info.name",
			"email":     "$user_info.email",
			"contactNo": "$contact_no",
			"isActive":  "$isActive",
			"createdAt": 1,
			"foodCourt": bson.M{
				"id":   "$fc_info._id",
				"name": "$fc_info.name",
			},

			"vendorId": "$vendor_info.user_id",

			"vendors": []string{"$vendor_info.shopName"},

			"vendor": bson.M{
				"id": "$vendor_info._id",

				"name": "$vendor_info.shopName",
			},
		}},

		{"$sort": bson.M{"createdAt": -1}},
		{"$skip": int64(skip)},
		{"$limit": int64(limit)},
	}

	cursor, err := db.Collection("managers").Aggregate(ctx, pipeline)
	if err != nil {
		utils.RespondError(c, 500, "Failed to fetch managers data")
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M = []bson.M{}
	if err := cursor.All(ctx, &results); err != nil {
		utils.RespondError(c, 500, "Decoding error")
		return
	}

	total, _ := db.Collection("managers").CountDocuments(ctx, bson.M{})

	utils.RespondSuccess(c, 200, "Managers fetched successfully", gin.H{
		"managers": results,
		"meta": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

func GetAdminDashboardStats(c *gin.Context, db *mongo.Database) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	fcCollection := db.Collection("foodcourts")
	fcCursor, err := fcCollection.Find(ctx, bson.M{"isOpen": true}, options.Find().SetLimit(10))

	var openFoodCourts []bson.M = []bson.M{}
	if err == nil {
		fcCursor.All(ctx, &openFoodCourts)
	}

	itemLinkCollection := db.Collection("itemfoodcourts")

	itemPipeline := []bson.M{
		{"$sort": bson.M{"createdAt": -1}},

		{"$limit": 5},

		{"$lookup": bson.M{
			"from":         "items",
			"localField":   "item_id",
			"foreignField": "_id",
			"as":           "item_details",
		}},
		{"$unwind": "$item_details"},

		{"$lookup": bson.M{
			"from":         "foodcourts",
			"localField":   "foodcourt_id",
			"foreignField": "_id",
			"as":           "fc",
		}},
		{"$unwind": "$fc"},

		{"$project": bson.M{
			"id":   "$_id",
			"name": "$item_details.name",

			"isVeg":    "$item_details.isVeg",
			"category": "$item_details.category",
			"price":    "$price",

			"status":        1,
			"createdAt":     1,
			"foodCourtName": "$fc.name",
		}},
	}

	itemCursor, err := itemLinkCollection.Aggregate(ctx, itemPipeline)
	var recentItems []bson.M = []bson.M{}
	if err == nil {
		itemCursor.All(ctx, &recentItems)
	}

	totalVendors, _ := db.Collection("vendors").CountDocuments(ctx, bson.M{})
	totalManagers, _ := db.Collection("managers").CountDocuments(ctx, bson.M{})

	totalItems, _ := db.Collection("items").CountDocuments(ctx, bson.M{})

	utils.RespondSuccess(c, 200, "Dashboard stats retrieved", gin.H{
		"stats": gin.H{
			"totalVendors":  totalVendors,
			"totalManagers": totalManagers,
			"totalItems":    totalItems,
		},
		"openFoodCourts": openFoodCourts,
		"recentItems":    recentItems,
	})
}

func UpdateVendorStatus(c *gin.Context, db *mongo.Database) {
	userID := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		utils.RespondError(c, 400, "Invalid User ID")
		return
	}

	var input struct {
		Role string `json:"role" binding:"required,oneof=user vendor"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondError(c, 400, "Role must be 'user' or 'vendor'")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	var vendor models.Vendor
	err = db.Collection("vendors").FindOne(ctx, bson.M{"user_id": objID}).Decode(&vendor)

	if input.Role == "user" && err == nil {

		itemCursor, _ := db.Collection("items").Find(ctx, bson.M{"vendor_id": vendor.ID})
		var items []models.Item
		itemCursor.All(ctx, &items)

		var itemIDs []primitive.ObjectID
		for _, item := range items {
			itemIDs = append(itemIDs, item.ID)
		}

		if len(itemIDs) > 0 {

			db.Collection("itemfoodcourts").DeleteMany(ctx, bson.M{"item_id": bson.M{"$in": itemIDs}})

			db.Collection("items").DeleteMany(ctx, bson.M{"_id": bson.M{"$in": itemIDs}})
		}

		db.Collection("managers").DeleteMany(ctx, bson.M{"vendor_id": vendor.ID})

		db.Collection("vendors").DeleteOne(ctx, bson.M{"_id": vendor.ID})

	}

	result, err := db.Collection("users").UpdateOne(
		ctx,
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"role": input.Role, "updatedAt": time.Now()}},
	)

	if err != nil || result.MatchedCount == 0 {
		utils.RespondError(c, 500, "Failed to update user role")
		return
	}

	utils.RespondSuccess(c, 200, "Status updated and related data cleaned", nil)
}
