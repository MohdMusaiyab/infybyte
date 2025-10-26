package controllers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
)

func GetUserProfile(c *gin.Context, db *mongo.Database) {
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	ctx := context.Background()
	usersCollection := db.Collection("users")

	var user struct {
		ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name      string             `bson:"name" json:"name"`
		Email     string             `bson:"email" json:"email"`
		Role      string             `bson:"role" json:"role"`
		CreatedAt primitive.DateTime `bson:"createdAt" json:"createdAt"`
		UpdatedAt primitive.DateTime `bson:"updatedAt" json:"updatedAt"`
	}

	err = usersCollection.FindOne(ctx, bson.M{"_id": userObjID}).Decode(&user)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "User profile retrieved successfully", user)
}

func UpdateUserProfile(c *gin.Context, db *mongo.Database) {
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var updateData struct {
		Name  *string `json:"name,omitempty" validate:"omitempty,min=2,max=50"`
		Email *string `json:"email,omitempty" validate:"omitempty,email"`
	}

	if err := c.BindJSON(&updateData); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	ctx := context.Background()
	usersCollection := db.Collection("users")

	updateFields := bson.M{}
	if updateData.Name != nil {
		updateFields["name"] = *updateData.Name
	}
	if updateData.Email != nil {
		updateFields["email"] = *updateData.Email
	}

	if len(updateFields) == 0 {
		utils.RespondError(c, http.StatusBadRequest, "No valid fields to update")
		return
	}

	updateFields["updatedAt"] = primitive.NewDateTimeFromTime(time.Now())

	_, err = usersCollection.UpdateOne(
		ctx,
		bson.M{"_id": userObjID},
		bson.M{"$set": updateFields},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update user profile")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "User profile updated successfully", nil)
}

// Getting all the Food Courts
func GetAllFoodCourts(c *gin.Context, db *mongo.Database) {
	ctx := context.Background()
	foodCourtsCollection := db.Collection("foodcourts")

	cursor, err := foodCourtsCollection.Find(ctx, bson.M{})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch food courts")
		return
	}
	defer cursor.Close(ctx)

	var foodCourts []struct {
		ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name     string             `bson:"name" json:"name"`
		Location string             `bson:"location" json:"location"`
		Timings  string             `bson:"timings,omitempty" json:"timings,omitempty"`
		IsOpen   bool               `bson:"isOpen" json:"isOpen"`
		Weekends bool               `bson:"weekends" json:"weekends"`
		Weekdays bool               `bson:"weekdays" json:"weekdays"`
	}

	if err := cursor.All(ctx, &foodCourts); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to process food courts data")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Food courts retrieved successfully", foodCourts)
}

func GetFoodCourtByID(c *gin.Context, db *mongo.Database) {
	foodCourtID := c.Param("id")
	foodCourtObjID, err := primitive.ObjectIDFromHex(foodCourtID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid food court ID")
		return
	}

	ctx := context.Background()
	collections := struct {
		foodCourts     *mongo.Collection
		vendors        *mongo.Collection
		items          *mongo.Collection
		foodCourtItems *mongo.Collection
	}{
		foodCourts:     db.Collection("foodcourts"),
		vendors:        db.Collection("vendors"),
		foodCourtItems: db.Collection("itemfoodcourts"),
	}
	// Get Food Court basic info
	var foodCourt struct {
		ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name     string             `bson:"name" json:"name"`
		Location string             `bson:"location" json:"location"`
		Timings  string             `bson:"timings,omitempty" json:"timings,omitempty"`
		IsOpen   bool               `bson:"isOpen" json:"isOpen"`
		Weekends bool               `bson:"weekends" json:"weekends"`
		Weekdays bool               `bson:"weekdays" json:"weekdays"`
	}
	err = collections.foodCourts.FindOne(ctx, bson.M{"_id": foodCourtObjID}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found")
		return
	}

	// Get Vendors in this food court
	var vendors []struct {
		ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		ShopName string             `bson:"shopName" json:"shopName"`
		GST      string             `bson:"gst,omitempty" json:"gst,omitempty"`
	}
	vendorsCursor, err := collections.vendors.Find(ctx, bson.M{"_id": bson.M{"$in": getVendorIDsFromFoodCourt(ctx, collections.foodCourts, foodCourtObjID)}})
	if err == nil {
		defer vendorsCursor.Close(ctx)
		vendorsCursor.All(ctx, &vendors)
	}

	// Get Items available in this food court with vendor info
	var itemsWithVendors []struct {
		ItemID      primitive.ObjectID `bson:"_id,omitempty" json:"itemId,omitempty"`
		Name        string             `bson:"name" json:"name"`
		Description string             `bson:"description,omitempty" json:"description,omitempty"`
		BasePrice   float64            `bson:"basePrice" json:"basePrice"`
		Category    string             `bson:"category" json:"category"`
		IsVeg       bool               `bson:"isVeg" json:"isVeg"`
		IsSpecial   bool               `bson:"isSpecial" json:"isSpecial"`
		VendorID    primitive.ObjectID `bson:"vendor_id" json:"vendorId"`
		ShopName    string             `bson:"shopName" json:"shopName"`
		Status      string             `bson:"status" json:"status"`
		Price       *float64           `bson:"price,omitempty" json:"price,omitempty"`
		TimeSlot    string             `bson:"timeSlot" json:"timeSlot"`
	}

	pipeline := []bson.M{
		{"$match": bson.M{"foodcourt_id": foodCourtObjID, "isActive": true}},
		{"$lookup": bson.M{
			"from":         "items",
			"localField":   "item_id",
			"foreignField": "_id",
			"as":           "item",
		}},
		{"$unwind": "$item"},
		{"$lookup": bson.M{
			"from":         "vendors",
			"localField":   "item.vendor_id",
			"foreignField": "_id",
			"as":           "vendor",
		}},
		{"$unwind": "$vendor"},
		{"$project": bson.M{
			"itemId":      "$item._id",
			"name":        "$item.name",
			"description": "$item.description",
			"basePrice":   "$item.basePrice",
			"category":    "$item.category",
			"isVeg":       "$item.isVeg",
			"isSpecial":   "$item.isSpecial",
			"vendorId":    "$vendor._id",
			"shopName":    "$vendor.shopName",
			"status":      "$status",
			"price":       "$price",
			"timeSlot":    "$timeSlot",
		}},
	}

	cursor, err := collections.foodCourtItems.Aggregate(ctx, pipeline)
	if err == nil {
		defer cursor.Close(ctx)
		cursor.All(ctx, &itemsWithVendors)
	}

	response := struct {
		FoodCourt interface{} `json:"foodCourt"`
		Vendors   interface{} `json:"vendors"`
		Items     interface{} `json:"items"`
	}{
		FoodCourt: foodCourt,
		Vendors:   vendors,
		Items:     itemsWithVendors,
	}

	utils.RespondSuccess(c, http.StatusOK, "Food court details retrieved successfully", response)
}

func getVendorIDsFromFoodCourt(ctx context.Context, foodCourtsCollection *mongo.Collection, foodCourtID primitive.ObjectID) []primitive.ObjectID {
	var foodCourt struct {
		VendorIDs []primitive.ObjectID `bson:"vendor_ids"`
	}
	foodCourtsCollection.FindOne(ctx, bson.M{"_id": foodCourtID}).Decode(&foodCourt)
	return foodCourt.VendorIDs
}

func GetFoodCourtItems(c *gin.Context, db *mongo.Database) {
	foodCourtID := c.Param("id")
	foodCourtObjID, err := primitive.ObjectIDFromHex(foodCourtID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid food court ID")
		return
	}

	ctx := context.Background()
	collections := struct {
		foodCourtItems *mongo.Collection
	}{
		foodCourtItems: db.Collection("itemfoodcourts"),
	}

	// Group items by vendor with food court specific details
	var vendorItems []struct {
		VendorID primitive.ObjectID `bson:"vendorId" json:"vendorId"`
		ShopName string             `bson:"shopName" json:"shopName"`
		Items    []interface{}      `bson:"items" json:"items"`
	}

	pipeline := []bson.M{
		{"$match": bson.M{"foodcourt_id": foodCourtObjID, "isActive": true}},
		{"$lookup": bson.M{
			"from":         "items",
			"localField":   "item_id",
			"foreignField": "_id",
			"as":           "item",
		}},
		{"$unwind": "$item"},
		{"$lookup": bson.M{
			"from":         "vendors",
			"localField":   "item.vendor_id",
			"foreignField": "_id",
			"as":           "vendor",
		}},
		{"$unwind": "$vendor"},
		{"$group": bson.M{
			"_id":      "$vendor._id",
			"shopName": bson.M{"$first": "$vendor.shopName"},
			"items": bson.M{"$push": bson.M{
				"itemId":      "$item._id",
				"name":        "$item.name",
				"description": "$item.description",
				"basePrice":   "$item.basePrice",
				"category":    "$item.category",
				"isVeg":       "$item.isVeg",
				"isSpecial":   "$item.isSpecial",
				"status":      "$status",
				"price":       "$price",
				"timeSlot":    "$timeSlot",
			}},
		}},
		{"$project": bson.M{
			"vendorId": "$_id",
			"shopName": 1,
			"items":    1,
			"_id":      0,
		}},
	}

	cursor, err := collections.foodCourtItems.Aggregate(ctx, pipeline)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch food court items")
		return
	}
	defer cursor.Close(ctx)

	if err := cursor.All(ctx, &vendorItems); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to process food court items")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Food court items retrieved successfully", vendorItems)
}

func GetVendorItemsWithFoodCourts(c *gin.Context, db *mongo.Database) {
	vendorID := c.Param("id")
	vendorObjID, err := primitive.ObjectIDFromHex(vendorID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid vendor ID")
		return
	}

	ctx := context.Background()
	collections := struct {
		foodCourtItems *mongo.Collection
		foodCourts     *mongo.Collection
		items          *mongo.Collection
	}{
		items: db.Collection("items"),
	}

	// Get items with their food court availability
	var itemsWithFoodCourts []struct {
		ItemID      primitive.ObjectID `bson:"itemId" json:"itemId"`
		Name        string             `bson:"name" json:"name"`
		Description string             `bson:"description" json:"description"`
		BasePrice   float64            `bson:"basePrice" json:"basePrice"`
		Category    string             `bson:"category" json:"category"`
		IsVeg       bool               `bson:"isVeg" json:"isVeg"`
		IsSpecial   bool               `bson:"isSpecial" json:"isSpecial"`
		FoodCourts  []interface{}      `bson:"foodCourts" json:"foodCourts"`
	}

	pipeline := []bson.M{
		{"$match": bson.M{"vendor_id": vendorObjID}},
		{"$lookup": bson.M{
			"from":         "itemfoodcourts",
			"localField":   "_id",
			"foreignField": "item_id",
			"as":           "foodCourtItems",
		}},
		{"$unwind": bson.M{"path": "$foodCourtItems", "preserveNullAndEmptyArrays": true}},
		{"$lookup": bson.M{
			"from":         "foodcourts",
			"localField":   "foodCourtItems.foodcourt_id",
			"foreignField": "_id",
			"as":           "foodCourt",
		}},
		{"$unwind": bson.M{"path": "$foodCourt", "preserveNullAndEmptyArrays": true}},
		{"$group": bson.M{
			"_id":         "$_id",
			"name":        bson.M{"$first": "$name"},
			"description": bson.M{"$first": "$description"},
			"basePrice":   bson.M{"$first": "$basePrice"},
			"category":    bson.M{"$first": "$category"},
			"isVeg":       bson.M{"$first": "$isVeg"},
			"isSpecial":   bson.M{"$first": "$isSpecial"},
			"foodCourts": bson.M{"$push": bson.M{
				"$cond": bson.M{
					"if": bson.M{"$ne": bson.A{"$foodCourt", nil}},
					"then": bson.M{
						"foodCourtId":   "$foodCourt._id",
						"foodCourtName": "$foodCourt.name",
						"location":      "$foodCourt.location",
						"status":        "$foodCourtItems.status",
						"price":         "$foodCourtItems.price",
						"timeSlot":      "$foodCourtItems.timeSlot",
						"isActive":      "$foodCourtItems.isActive",
					},
					"else": "$$REMOVE",
				},
			}},
		}},
		{"$project": bson.M{
			"itemId":      "$_id",
			"name":        1,
			"description": 1,
			"basePrice":   1,
			"category":    1,
			"isVeg":       1,
			"isSpecial":   1,
			"foodCourts":  1,
			"_id":         0,
		}},
	}

	cursor, err := collections.items.Aggregate(ctx, pipeline)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch vendor items")
		return
	}
	defer cursor.Close(ctx)

	if err := cursor.All(ctx, &itemsWithFoodCourts); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to process vendor items")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Vendor items with food courts retrieved successfully", itemsWithFoodCourts)
}
