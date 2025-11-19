package controllers

import (
	"context"
	"net/http"
	"time"

	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ManagerDashboardResponse struct {
	User       interface{}          `json:"user"`
	Manager    interface{}          `json:"manager"`
	FoodCourts []FoodCourtDashboard `json:"foodCourts"`
	Vendor     interface{}          `json:"vendor"`
	Managers   []interface{}        `json:"managers"`
}

type FoodCourtDashboard struct {
	FoodCourt interface{} `json:"foodCourt"`
	ItemCount int         `json:"itemCount"`
}

func GetManagerDashboard(c *gin.Context, db *mongo.Database) {
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
	collections := struct {
		users          *mongo.Collection
		vendors        *mongo.Collection
		items          *mongo.Collection
		foodCourts     *mongo.Collection
		managers       *mongo.Collection
		itemFoodCourts *mongo.Collection
	}{
		users:          db.Collection("users"),
		vendors:        db.Collection("vendors"),
		items:          db.Collection("items"),
		foodCourts:     db.Collection("foodcourts"),
		managers:       db.Collection("managers"),
		itemFoodCourts: db.Collection("itemfoodcourts"),
	}

	var response ManagerDashboardResponse

	// Fetch User Profile
	var user struct {
		ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name      string             `bson:"name" json:"name"`
		Email     string             `bson:"email" json:"email"`
		Role      string             `bson:"role" json:"role"`
		CreatedAt primitive.DateTime `bson:"createdAt" json:"createdAt"`
	}
	err = collections.users.FindOne(ctx, bson.M{"_id": userObjID}).Decode(&user)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}
	response.User = user

	// Fetch Manager Details
	var manager struct {
		ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		UserID      primitive.ObjectID `bson:"user_id" json:"user_id"`
		VendorID    primitive.ObjectID `bson:"vendor_id" json:"vendor_id"`
		FoodCourtID primitive.ObjectID `bson:"foodcourt_id" json:"foodcourt_id"`
		ContactNo   string             `bson:"contact_no" json:"contact_no"`
		IsActive    bool               `bson:"isActive" json:"isActive"`
		CreatedAt   primitive.DateTime `bson:"createdAt" json:"createdAt"`
	}
	err = collections.managers.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&manager)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Manager profile not found")
		return
	}
	response.Manager = manager

	// Fetch Vendor Details (Owner)
	var vendor struct {
		ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		ShopName string             `bson:"shopName" json:"shopName"`
		GST      string             `bson:"gst,omitempty" json:"gst,omitempty"`
		UserID   primitive.ObjectID `bson:"user_id" json:"user_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"_id": manager.VendorID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}
	response.Vendor = vendor

	// Fetch Assigned Food Court Details
	var foodCourt struct {
		ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name      string             `bson:"name" json:"name"`
		Location  string             `bson:"location" json:"location"`
		IsOpen    bool               `bson:"isOpen" json:"isOpen"`
		Timings   string             `bson:"timings,omitempty" json:"timings,omitempty"`
		Weekends  bool               `bson:"weekends" json:"weekends"`
		Weekdays  bool               `bson:"weekdays" json:"weekdays"`
		CreatedAt primitive.DateTime `bson:"createdAt" json:"createdAt"`
	}
	err = collections.foodCourts.FindOne(ctx, bson.M{"_id": manager.FoodCourtID}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found")
		return
	}

	// Count items in this food court for this vendor
	itemCount, err := collections.itemFoodCourts.CountDocuments(ctx, bson.M{
		"foodcourt_id": manager.FoodCourtID,
		"item_id":      bson.M{"$in": getVendorItemIDs(ctx, collections.items, manager.VendorID)},
	})
	if err != nil {
		itemCount = 0
	}

	// Prepare food courts array with item count
	foodCourtDashboard := FoodCourtDashboard{
		FoodCourt: foodCourt,
		ItemCount: int(itemCount),
	}
	response.FoodCourts = []FoodCourtDashboard{foodCourtDashboard}

	// Fetch Other Managers in same Food Court and same Vendor
	managersCursor, err := collections.managers.Find(ctx, bson.M{
		"foodcourt_id": manager.FoodCourtID,
		"vendor_id":    manager.VendorID,
		"user_id":      bson.M{"$ne": userObjID},
	})
	if err == nil {
		defer managersCursor.Close(ctx)
		var managers []interface{}
		for managersCursor.Next(ctx) {
			var mgr struct {
				ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
				UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
				ContactNo string             `bson:"contact_no" json:"contact_no"`
				IsActive  bool               `bson:"isActive" json:"isActive"`
				CreatedAt primitive.DateTime `bson:"createdAt" json:"createdAt"`
			}
			if err := managersCursor.Decode(&mgr); err == nil {
				managers = append(managers, mgr)
			}
		}
		response.Managers = managers
	}

	utils.RespondSuccess(c, http.StatusOK, "Manager dashboard retrieved successfully", response)
}

// Helper function to get vendor's item IDs
func getVendorItemIDs(ctx context.Context, itemsCollection *mongo.Collection, vendorID primitive.ObjectID) []primitive.ObjectID {
	var itemIDs []primitive.ObjectID
	cursor, err := itemsCollection.Find(ctx, bson.M{"vendor_id": vendorID})
	if err != nil {
		return itemIDs
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var item struct {
			ID primitive.ObjectID `bson:"_id"`
		}
		if err := cursor.Decode(&item); err == nil {
			itemIDs = append(itemIDs, item.ID)
		}
	}
	return itemIDs
}

func GetManagerFoodCourtWithItems(c *gin.Context, db *mongo.Database) {
	foodCourtID := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}

	foodCourtObjID, err := primitive.ObjectIDFromHex(foodCourtID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid food court ID")
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	ctx := context.Background()
	collections := struct {
		foodCourts     *mongo.Collection
		managers       *mongo.Collection
		itemFoodCourts *mongo.Collection
		items          *mongo.Collection
	}{
		foodCourts:     db.Collection("foodcourts"),
		managers:       db.Collection("managers"),
		itemFoodCourts: db.Collection("itemfoodcourts"),
		items:          db.Collection("items"),
	}

	// Verify manager has access to this food court
	var manager struct {
		FoodCourtID primitive.ObjectID `bson:"foodcourt_id"`
	}
	err = collections.managers.FindOne(ctx, bson.M{
		"user_id":      userObjID,
		"foodcourt_id": foodCourtObjID,
	}).Decode(&manager)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, "Access denied to this food court")
		return
	}

	// Get food court basic information
	var foodCourt struct {
		ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name     string             `bson:"name" json:"name"`
		Location string             `bson:"location" json:"location"`
		IsOpen   bool               `bson:"isOpen" json:"isOpen"`
		Timings  string             `bson:"timings,omitempty" json:"timings,omitempty"`
	}
	err = collections.foodCourts.FindOne(ctx, bson.M{"_id": foodCourtObjID}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found")
		return
	}

	// Get manager details to get vendor ID
	var managerDetails struct {
		VendorID primitive.ObjectID `bson:"vendor_id"`
	}
	err = collections.managers.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&managerDetails)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Manager details not found")
		return
	}

	// Get vendor's items in this food court
	vendorItems, err := collections.items.Find(ctx, bson.M{"vendor_id": managerDetails.VendorID})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch vendor items")
		return
	}
	defer vendorItems.Close(ctx)

	var itemIDs []primitive.ObjectID
	for vendorItems.Next(ctx) {
		var item struct {
			ID primitive.ObjectID `bson:"_id"`
		}
		if err := vendorItems.Decode(&item); err == nil {
			itemIDs = append(itemIDs, item.ID)
		}
	}

	// Get food court items with details using proper bson.D with keys
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"foodcourt_id": foodCourtObjID,
			"item_id":      bson.M{"$in": itemIDs},
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "items",
			"localField":   "item_id",
			"foreignField": "_id",
			"as":           "item_details",
		}}},
		{{Key: "$unwind", Value: "$item_details"}},
		{{Key: "$project", Value: bson.M{
			"item_id":     1,
			"status":      1,
			"price":       1,
			"isActive":    1,
			"timeSlot":    1,
			"name":        "$item_details.name",
			"description": "$item_details.description",
			"category":    "$item_details.category",
			"isVeg":       "$item_details.isVeg",
			"basePrice":   "$item_details.basePrice",
		}}},
	}

	cursor, err := collections.itemFoodCourts.Aggregate(ctx, pipeline)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch items")
		return
	}
	defer cursor.Close(ctx)

	var items []interface{}
	if err = cursor.All(ctx, &items); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to process items")
		return
	}

	response := gin.H{
		"foodCourt": foodCourt,
		"items":     items,
	}

	utils.RespondSuccess(c, http.StatusOK, "Food court details retrieved successfully", response)
}

func GetManagerFoodCourtItem(c *gin.Context, db *mongo.Database) {
	foodCourtID := c.Param("id")
	itemID := c.Param("itemId")
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}

	foodCourtObjID, err := primitive.ObjectIDFromHex(foodCourtID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid food court ID")
		return
	}

	itemObjID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid item ID")
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	ctx := context.Background()
	collections := struct {
		foodCourts     *mongo.Collection
		managers       *mongo.Collection
		itemFoodCourts *mongo.Collection
		items          *mongo.Collection
	}{
		foodCourts:     db.Collection("foodcourts"),
		managers:       db.Collection("managers"),
		itemFoodCourts: db.Collection("itemfoodcourts"),
		items:          db.Collection("items"),
	}

	// Verify manager has access to this food court
	var manager struct {
		FoodCourtID primitive.ObjectID `bson:"foodcourt_id"`
		VendorID    primitive.ObjectID `bson:"vendor_id"`
	}
	err = collections.managers.FindOne(ctx, bson.M{
		"user_id":      userObjID,
		"foodcourt_id": foodCourtObjID,
	}).Decode(&manager)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, "Access denied to this food court")
		return
	}

	// Get food court basic information
	var foodCourt struct {
		ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name     string             `bson:"name" json:"name"`
		Location string             `bson:"location" json:"location"`
	}
	err = collections.foodCourts.FindOne(ctx, bson.M{"_id": foodCourtObjID}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found")
		return
	}

	// Verify item belongs to manager's vendor
	var item struct {
		VendorID primitive.ObjectID `bson:"vendor_id"`
	}
	err = collections.items.FindOne(ctx, bson.M{"_id": itemObjID}).Decode(&item)
	if err != nil || item.VendorID != manager.VendorID {
		utils.RespondError(c, http.StatusForbidden, "Access denied to this item")
		return
	}

	// Get food court item details using proper bson.D with keys
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"foodcourt_id": foodCourtObjID,
			"item_id":      itemObjID,
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "items",
			"localField":   "item_id",
			"foreignField": "_id",
			"as":           "item_details",
		}}},
		{{Key: "$unwind", Value: "$item_details"}},
		{{Key: "$project", Value: bson.M{
			"_id":         1,
			"item_id":     1,
			"status":      1,
			"price":       1,
			"isActive":    1,
			"timeSlot":    1,
			"createdAt":   1,
			"updatedAt":   1,
			"name":        "$item_details.name",
			"description": "$item_details.description",
			"category":    "$item_details.category",
			"isVeg":       "$item_details.isVeg",
			"isSpecial":   "$item_details.isSpecial",
			"basePrice":   "$item_details.basePrice",
		}}},
	}

	cursor, err := collections.itemFoodCourts.Aggregate(ctx, pipeline)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch item details")
		return
	}
	defer cursor.Close(ctx)

	var foodCourtItem interface{}
	if cursor.Next(ctx) {
		cursor.Decode(&foodCourtItem)
	} else {
		utils.RespondError(c, http.StatusNotFound, "Item not found in this food court")
		return
	}

	response := gin.H{
		"foodCourt": foodCourt,
		"item":      foodCourtItem,
	}

	utils.RespondSuccess(c, http.StatusOK, "Food court item details retrieved successfully", response)
}

// UpdateFoodCourtItemStatus - Update only status of item in food court
func UpdateFoodCourtItemStatus(c *gin.Context, db *mongo.Database) {
	itemID := c.Param("itemId")
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var request struct {
		Status string `json:"status" validate:"required,oneof=available notavailable sellingfast finishingsoon"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request data")
		return
	}

	// The itemID from parameter is the itemFoodCourts document ID, not the item ID
	itemFoodCourtObjID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid item ID")
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	ctx := context.Background()
	collections := struct {
		managers       *mongo.Collection
		itemFoodCourts *mongo.Collection
		items          *mongo.Collection
	}{
		managers:       db.Collection("managers"),
		itemFoodCourts: db.Collection("itemfoodcourts"),
		items:          db.Collection("items"),
	}

	// Get manager's food court and vendor
	var manager struct {
		FoodCourtID primitive.ObjectID `bson:"foodcourt_id"`
		VendorID    primitive.ObjectID `bson:"vendor_id"`
	}
	err = collections.managers.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&manager)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, "Manager not found")
		return
	}

	// First, get the itemFoodCourts document to find the actual item_id
	var itemFoodCourt struct {
		ID        primitive.ObjectID `bson:"_id"`
		ItemID    primitive.ObjectID `bson:"item_id"`
		VendorID  primitive.ObjectID `bson:"vendor_id,omitempty"` // if you have this field
	}
	err = collections.itemFoodCourts.FindOne(ctx, bson.M{
		"_id":          itemFoodCourtObjID,
		"foodcourt_id": manager.FoodCourtID, // Ensure it's in manager's food court
	}).Decode(&itemFoodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, "Item not found in your food court")
		return
	}

	// Verify the item belongs to manager's vendor through the items collection
	var item struct {
		VendorID primitive.ObjectID `bson:"vendor_id"`
	}
	err = collections.items.FindOne(ctx, bson.M{"_id": itemFoodCourt.ItemID}).Decode(&item)
	if err != nil || item.VendorID != manager.VendorID {
		utils.RespondError(c, http.StatusForbidden, "Access denied to this item")
		return
	}

	// Update status
	result, err := collections.itemFoodCourts.UpdateOne(
		ctx,
		bson.M{
			"_id":          itemFoodCourtObjID, // Use the correct document ID
			"foodcourt_id": manager.FoodCourtID,
		},
		bson.M{
			"$set": bson.M{
				"status":    request.Status,
				"updatedAt": primitive.NewDateTimeFromTime(time.Now()),
			},
		},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update item status")
		return
	}

	if result.MatchedCount == 0 {
		utils.RespondError(c, http.StatusNotFound, "Item not found in your food court")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Item status updated successfully", nil)
}

// UpdateFoodCourtItem - Update all FC-specific item information
func UpdateFoodCourtItemByManager(c *gin.Context, db *mongo.Database) {
	itemID := c.Param("itemId")
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var request struct {
		Status   string   `json:"status" validate:"omitempty,oneof=available notavailable sellingfast finishingsoon"`
		Price    *float64 `json:"price,omitempty"`
		IsActive *bool    `json:"isActive,omitempty"`
		TimeSlot string   `json:"timeSlot" validate:"omitempty,oneof=breakfast lunch snacks dinner"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request data")
		return
	}

	itemObjID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid item ID")
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	ctx := context.Background()
	collections := struct {
		managers       *mongo.Collection
		itemFoodCourts *mongo.Collection
		items          *mongo.Collection
	}{
		managers:       db.Collection("managers"),
		itemFoodCourts: db.Collection("itemfoodcourts"),
		items:          db.Collection("items"),
	}

	// Get manager's food court
	var manager struct {
		FoodCourtID primitive.ObjectID `bson:"foodcourt_id"`
		VendorID    primitive.ObjectID `bson:"vendor_id"`
	}
	err = collections.managers.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&manager)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, "Manager not found")
		return
	}

	// Verify item belongs to manager's vendor
	var item struct {
		VendorID primitive.ObjectID `bson:"vendor_id"`
	}
	err = collections.items.FindOne(ctx, bson.M{"_id": itemObjID}).Decode(&item)
	if err != nil || item.VendorID != manager.VendorID {
		utils.RespondError(c, http.StatusForbidden, "Access denied to this item")
		return
	}

	// Build update fields using time.Now()
	updateFields := bson.M{
		"updatedAt": primitive.NewDateTimeFromTime(time.Now()),
	}
	if request.Status != "" {
		updateFields["status"] = request.Status
	}
	if request.Price != nil {
		updateFields["price"] = request.Price
	}
	if request.IsActive != nil {
		updateFields["isActive"] = request.IsActive
	}
	if request.TimeSlot != "" {
		updateFields["timeSlot"] = request.TimeSlot
	}

	// Update food court item
	result, err := collections.itemFoodCourts.UpdateOne(
		ctx,
		bson.M{
			"item_id":      itemObjID,
			"foodcourt_id": manager.FoodCourtID,
		},
		bson.M{"$set": updateFields},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update item")
		return
	}

	if result.MatchedCount == 0 {
		utils.RespondError(c, http.StatusNotFound, "Item not found in your food court")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Item updated successfully", nil)
}