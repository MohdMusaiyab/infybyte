package controllers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/MohdMusaiyab/infybyte/server/internal/models"
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

	// Initialize managers as empty array to prevent null
	response.Managers = []interface{}{}

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
		for managersCursor.Next(ctx) {
			var mgr struct {
				ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
				UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
				ContactNo string             `bson:"contact_no" json:"contact_no"`
				IsActive  bool               `bson:"isActive" json:"isActive"`
				CreatedAt primitive.DateTime `bson:"createdAt" json:"createdAt"`
			}
			if err := managersCursor.Decode(&mgr); err == nil {
				response.Managers = append(response.Managers, mgr)
			}
		}
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
		ID       primitive.ObjectID `bson:"_id"`
		ItemID   primitive.ObjectID `bson:"item_id"`
		VendorID primitive.ObjectID `bson:"vendor_id,omitempty"` // if you have this field
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
	var updatedItemFoodCourt models.ItemFoodCourt
	err = collections.itemFoodCourts.FindOne(ctx, bson.M{"_id": itemFoodCourtObjID}).Decode(&updatedItemFoodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch updated item")
		return
	}

	// ✅ NEW: Broadcast the update to all connected clients
	utils.BroadcastItemFoodCourtUpdate(updatedItemFoodCourt, "update")
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
	var updatedItemFoodCourt models.ItemFoodCourt
	err = collections.itemFoodCourts.FindOne(ctx, bson.M{
		"item_id":      itemObjID,
		"foodcourt_id": manager.FoodCourtID,
	}).Decode(&updatedItemFoodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch updated item")
		return
	}

	// ✅ NEW: Broadcast the update to all connected clients
	utils.BroadcastItemFoodCourtUpdate(updatedItemFoodCourt, "update")

	utils.RespondSuccess(c, http.StatusOK, "Item updated successfully", nil)
}

// GetManagerItemWithFCAssignments - Get item details with FC assignment status across manager's FCs
func GetManagerItemWithFCAssignments(c *gin.Context, db *mongo.Database) {
	itemID := c.Param("itemId")
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "User not authenticated")
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
		items          *mongo.Collection
		foodCourts     *mongo.Collection
		foodCourtItems *mongo.Collection
	}{
		managers:       db.Collection("managers"),
		items:          db.Collection("items"),
		foodCourts:     db.Collection("foodcourts"),
		foodCourtItems: db.Collection("itemfoodcourts"),
	}

	// Get manager's vendor and all assigned food courts
	var manager struct {
		VendorID primitive.ObjectID `bson:"vendor_id"`
	}
	err = collections.managers.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&manager)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Manager not found")
		return
	}

	// Get all food courts where this manager is assigned
	managerFCsCursor, err := collections.managers.Find(ctx, bson.M{"user_id": userObjID})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch manager assignments")
		return
	}
	defer managerFCsCursor.Close(ctx)

	var managerFoodCourtIDs []primitive.ObjectID
	var managerFoodCourts []bson.M

	for managerFCsCursor.Next(ctx) {
		var mgr struct {
			FoodCourtID primitive.ObjectID `bson:"foodcourt_id"`
		}
		if err := managerFCsCursor.Decode(&mgr); err == nil {
			managerFoodCourtIDs = append(managerFoodCourtIDs, mgr.FoodCourtID)
		}
	}

	// Get food court details for manager's FCs
	if len(managerFoodCourtIDs) > 0 {
		fcCursor, err := collections.foodCourts.Find(ctx, bson.M{"_id": bson.M{"$in": managerFoodCourtIDs}})
		if err == nil {
			defer fcCursor.Close(ctx)
			fcCursor.All(ctx, &managerFoodCourts)
		}
	}

	// Verify item belongs to manager's vendor and get item details
	var item struct {
		ID          primitive.ObjectID `bson:"_id"`
		Name        string             `bson:"name"`
		Description string             `bson:"description"`
		BasePrice   float64            `bson:"basePrice"`
		Category    string             `bson:"category"`
		IsVeg       bool               `bson:"isVeg"`
		IsSpecial   bool               `bson:"isSpecial"`
		VendorID    primitive.ObjectID `bson:"vendor_id"`
	}
	err = collections.items.FindOne(ctx, bson.M{"_id": itemObjID}).Decode(&item)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Item not found")
		return
	}

	// Security check: item must belong to manager's vendor
	if item.VendorID != manager.VendorID {
		utils.RespondError(c, http.StatusForbidden, "Access denied to this item")
		return
	}

	// Get current FC assignments for this item
	fcItemsCursor, err := collections.foodCourtItems.Find(ctx, bson.M{"item_id": itemObjID})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch FC assignments")
		return
	}
	defer fcItemsCursor.Close(ctx)

	var currentFCItems []bson.M
	fcItemsCursor.All(ctx, &currentFCItems)

	// Create lookup for current assignments
	currentFCAssignments := make(map[primitive.ObjectID]bson.M)
	for _, fcItem := range currentFCItems {
		if fcID, ok := fcItem["foodcourt_id"].(primitive.ObjectID); ok {
			currentFCAssignments[fcID] = fcItem
		}
	}

	// Categorize food courts
	var currentAssignments []interface{}
	var availableForAssignment []interface{}
	var notAccessible []interface{}

	// Get all food courts to check accessibility
	allFCsCursor, err := collections.foodCourts.Find(ctx, bson.M{})
	if err == nil {
		defer allFCsCursor.Close(ctx)
		var allFoodCourts []bson.M
		allFCsCursor.All(ctx, &allFoodCourts)

		for _, fc := range allFoodCourts {
			fcID := fc["_id"].(primitive.ObjectID)
			fcName := fc["name"].(string)
			location := fc["location"].(string)

			fcInfo := bson.M{
				"foodCourtId":   fcID,
				"foodCourtName": fcName,
				"location":      location,
			}

			// Check if manager has access to this FC
			managerHasAccess := false
			for _, mgrFCID := range managerFoodCourtIDs {
				if mgrFCID == fcID {
					managerHasAccess = true
					break
				}
			}

			if managerHasAccess {
				// Check if item is already in this FC
				if fcItem, exists := currentFCAssignments[fcID]; exists {
					// Item is in this FC - add to current assignments
					assignment := bson.M{
						"foodCourtId":   fcID,
						"foodCourtName": fcName,
						"location":      location,
						"status":        fcItem["status"],
						"price":         fcItem["price"],
						"timeSlot":      fcItem["timeSlot"],
						"isActive":      fcItem["isActive"],
						"updatedAt":     fcItem["updatedAt"],
					}
					currentAssignments = append(currentAssignments, assignment)
				} else {
					// Item is not in this FC but manager has access - available for assignment
					availableForAssignment = append(availableForAssignment, fcInfo)
				}
			} else {
				// Manager doesn't have access to this FC
				if _, exists := currentFCAssignments[fcID]; exists {
					// Item is in this FC but manager doesn't have access
					notAccessible = append(notAccessible, bson.M{
						"foodCourtId":   fcID,
						"foodCourtName": fcName,
						"location":      location,
						"reason":        "Not assigned as manager to this food court",
					})
				}
			}
		}
	}

	response := bson.M{
		"item": bson.M{
			"id":          item.ID,
			"name":        item.Name,
			"description": item.Description,
			"basePrice":   item.BasePrice,
			"category":    item.Category,
			"isVeg":       item.IsVeg,
			"isSpecial":   item.IsSpecial,
			"vendorId":    item.VendorID,
		},
		"currentAssignments":     currentAssignments,
		"availableForAssignment": availableForAssignment,
		"notAccessible":          notAccessible,
		"accessInfo": bson.M{
			"managerFoodCourts": len(managerFoodCourtIDs),
			"totalAssignments":  len(currentAssignments),
			"canManage":         len(managerFoodCourtIDs) > 0,
		},
	}

	utils.RespondSuccess(c, http.StatusOK, "Item FC assignments retrieved successfully", response)
}

// AddItemToManagerFoodCourt - Add item to a food court where manager has access
func AddItemToManagerFoodCourt(c *gin.Context, db *mongo.Database) {
	itemID := c.Param("itemId")
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var request struct {
		FoodCourtID primitive.ObjectID `json:"foodCourtId" validate:"required"`
		Status      string             `json:"status" validate:"required,oneof=available notavailable sellingfast finishingsoon"`
		Price       *float64           `json:"price,omitempty"`
		TimeSlot    string             `json:"timeSlot" validate:"required,oneof=breakfast lunch snacks dinner"`
	}

	if err := c.BindJSON(&request); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request payload")
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
		items          *mongo.Collection
		foodCourtItems *mongo.Collection
	}{
		managers:       db.Collection("managers"),
		items:          db.Collection("items"),
		foodCourtItems: db.Collection("itemfoodcourts"),
	}

	// Get manager's vendor
	var manager struct {
		VendorID primitive.ObjectID `bson:"vendor_id"`
	}
	err = collections.managers.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&manager)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Manager not found")
		return
	}

	// Verify item belongs to manager's vendor
	var item struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.items.FindOne(ctx, bson.M{"_id": itemObjID, "vendor_id": manager.VendorID}).Decode(&item)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, "Item not found or access denied")
		return
	}

	// Verify manager has access to the target food court
	managerAccess, err := collections.managers.CountDocuments(ctx, bson.M{
		"user_id":      userObjID,
		"foodcourt_id": request.FoodCourtID,
	})
	if err != nil || managerAccess == 0 {
		utils.RespondError(c, http.StatusForbidden, "Access denied to this food court")
		return
	}

	// Check if item already exists in this food court
	existing, err := collections.foodCourtItems.CountDocuments(ctx, bson.M{
		"item_id":      itemObjID,
		"foodcourt_id": request.FoodCourtID,
	})
	if err == nil && existing > 0 {
		utils.RespondError(c, http.StatusConflict, "Item already exists in this food court")
		return
	}

	// Create food court item
	foodCourtItem := bson.M{
		"item_id":      itemObjID,
		"foodcourt_id": request.FoodCourtID,
		"status":       request.Status,
		"price":        request.Price,
		"timeSlot":     request.TimeSlot,
		"isActive":     true,
		"createdAt":    primitive.NewDateTimeFromTime(time.Now()),
		"updatedAt":    primitive.NewDateTimeFromTime(time.Now()),
	}

	result, err := collections.foodCourtItems.InsertOne(ctx, foodCourtItem)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to add item to food court")
		return
	}
	var createdItemFoodCourt models.ItemFoodCourt
	err = collections.foodCourtItems.FindOne(ctx, bson.M{"_id": result.InsertedID}).Decode(&createdItemFoodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch created item")
		return
	}

	// ✅ NEW: Broadcast the creation to all connected clients
	utils.BroadcastItemFoodCourtUpdate(createdItemFoodCourt, "create")
	utils.RespondSuccess(c, http.StatusCreated, "Item added to food court successfully", bson.M{"id": result.InsertedID})
}

// UpdateItemInManagerFoodCourt - Update FC-specific details for item
func UpdateItemInManagerFoodCourt(c *gin.Context, db *mongo.Database) {
	itemID := c.Param("itemId")
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var request struct {
		FoodCourtID primitive.ObjectID `json:"foodCourtId" validate:"required"`
		Status      *string            `json:"status,omitempty" validate:"omitempty,oneof=available notavailable sellingfast finishingsoon"`
		Price       *float64           `json:"price,omitempty"`
		TimeSlot    *string            `json:"timeSlot,omitempty" validate:"omitempty,oneof=breakfast lunch snacks dinner"`
		IsActive    *bool              `json:"isActive,omitempty"`
	}

	if err := c.BindJSON(&request); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request payload")
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
		items          *mongo.Collection
		foodCourtItems *mongo.Collection
	}{
		managers:       db.Collection("managers"),
		items:          db.Collection("items"),
		foodCourtItems: db.Collection("itemfoodcourts"),
	}

	// Get manager's vendor
	var manager struct {
		VendorID primitive.ObjectID `bson:"vendor_id"`
	}
	err = collections.managers.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&manager)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Manager not found")
		return
	}

	// Verify item belongs to manager's vendor
	var item struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.items.FindOne(ctx, bson.M{"_id": itemObjID, "vendor_id": manager.VendorID}).Decode(&item)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, "Item not found or access denied")
		return
	}

	// Verify manager has access to the food court
	managerAccess, err := collections.managers.CountDocuments(ctx, bson.M{
		"user_id":      userObjID,
		"foodcourt_id": request.FoodCourtID,
	})
	if err != nil || managerAccess == 0 {
		utils.RespondError(c, http.StatusForbidden, "Access denied to this food court")
		return
	}

	// Build update fields
	updateFields := bson.M{
		"updatedAt": primitive.NewDateTimeFromTime(time.Now()),
	}
	if request.Status != nil {
		updateFields["status"] = *request.Status
	}
	if request.Price != nil {
		updateFields["price"] = *request.Price
	}
	if request.TimeSlot != nil {
		updateFields["timeSlot"] = *request.TimeSlot
	}
	if request.IsActive != nil {
		updateFields["isActive"] = *request.IsActive
	}

	if len(updateFields) == 1 { // Only updatedAt was set
		utils.RespondError(c, http.StatusBadRequest, "No valid fields to update")
		return
	}

	// Update the food court item
	result, err := collections.foodCourtItems.UpdateOne(
		ctx,
		bson.M{
			"item_id":      itemObjID,
			"foodcourt_id": request.FoodCourtID,
		},
		bson.M{"$set": updateFields},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update item in food court")
		return
	}

	if result.MatchedCount == 0 {
		utils.RespondError(c, http.StatusNotFound, "Item not found in this food court")
		return
	}
	// ✅ NEW: Fetch the updated document for broadcasting
	var updatedItemFoodCourt models.ItemFoodCourt
	err = collections.foodCourtItems.FindOne(ctx, bson.M{
		"item_id":      itemObjID,
		"foodcourt_id": request.FoodCourtID,
	}).Decode(&updatedItemFoodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch updated item")
		return
	}

	// ✅ NEW: Broadcast the update to all connected clients
	utils.BroadcastItemFoodCourtUpdate(updatedItemFoodCourt, "update")
	utils.RespondSuccess(c, http.StatusOK, "Item updated in food court successfully", nil)
}

// RemoveItemFromManagerFoodCourt - Remove item from a food court
func RemoveItemFromManagerFoodCourt(c *gin.Context, db *mongo.Database) {
	itemID := c.Param("itemId")
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var request struct {
		FoodCourtID primitive.ObjectID `json:"foodCourtId" validate:"required"`
	}

	if err := c.BindJSON(&request); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request payload")
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
		items          *mongo.Collection
		foodCourtItems *mongo.Collection
	}{
		managers:       db.Collection("managers"),
		items:          db.Collection("items"),
		foodCourtItems: db.Collection("itemfoodcourts"),
	}

	// Get manager's vendor
	var manager struct {
		VendorID primitive.ObjectID `bson:"vendor_id"`
	}
	err = collections.managers.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&manager)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Manager not found")
		return
	}

	// Verify item belongs to manager's vendor
	var item struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.items.FindOne(ctx, bson.M{"_id": itemObjID, "vendor_id": manager.VendorID}).Decode(&item)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, "Item not found or access denied")
		return
	}

	// Verify manager has access to the food court
	managerAccess, err := collections.managers.CountDocuments(ctx, bson.M{
		"user_id":      userObjID,
		"foodcourt_id": request.FoodCourtID,
	})
	if err != nil || managerAccess == 0 {
		utils.RespondError(c, http.StatusForbidden, "Access denied to this food court")
		return
	}

	// Delete the food court item
	// ✅ NEW: Fetch the item to be deleted for broadcasting
	var itemToDelete models.ItemFoodCourt
	err = collections.foodCourtItems.FindOne(ctx, bson.M{
		"item_id":      itemObjID,
		"foodcourt_id": request.FoodCourtID,
	}).Decode(&itemToDelete)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Item not found in this food court")
		return
	}

	// Delete the food court item
	result, err := collections.foodCourtItems.DeleteOne(ctx, bson.M{
		"item_id":      itemObjID,
		"foodcourt_id": request.FoodCourtID,
	})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to remove item from food court")
		return
	}

	if result.DeletedCount == 0 {
		utils.RespondError(c, http.StatusNotFound, "Item not found in this food court")
		return
	}

	// ✅ NEW: Broadcast the deletion to all connected clients
	utils.BroadcastItemFoodCourtUpdate(itemToDelete, "delete")

	utils.RespondSuccess(c, http.StatusOK, "Item removed from food court successfully", nil)
}

// GetVendorItemsForManager - Get all vendor items with quick FC status for manager
func GetVendorItemsForManager(c *gin.Context, db *mongo.Database) {
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
		managers       *mongo.Collection
		items          *mongo.Collection
		foodCourtItems *mongo.Collection
		foodCourts     *mongo.Collection
	}{
		managers:       db.Collection("managers"),
		items:          db.Collection("items"),
		foodCourtItems: db.Collection("itemfoodcourts"),
		foodCourts:     db.Collection("foodcourts"),
	}

	// Get manager's vendor and food courts
	var manager struct {
		VendorID primitive.ObjectID `bson:"vendor_id"`
	}
	err = collections.managers.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&manager)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Manager not found")
		return
	}

	// Get all food courts where manager is assigned
	managerFCsCursor, err := collections.managers.Find(ctx, bson.M{"user_id": userObjID})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch manager assignments")
		return
	}
	defer managerFCsCursor.Close(ctx)

	var managerFoodCourtIDs []primitive.ObjectID
	var managerFoodCourts []bson.M

	for managerFCsCursor.Next(ctx) {
		var mgr struct {
			FoodCourtID primitive.ObjectID `bson:"foodcourt_id"`
		}
		if err := managerFCsCursor.Decode(&mgr); err == nil {
			managerFoodCourtIDs = append(managerFoodCourtIDs, mgr.FoodCourtID)
		}
	}

	// Get food court details
	if len(managerFoodCourtIDs) > 0 {
		fcCursor, err := collections.foodCourts.Find(ctx, bson.M{"_id": bson.M{"$in": managerFoodCourtIDs}})
		if err == nil {
			defer fcCursor.Close(ctx)
			fcCursor.All(ctx, &managerFoodCourts)
		}
	}

	// Get all vendor items
	itemsCursor, err := collections.items.Find(ctx, bson.M{"vendor_id": manager.VendorID})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch vendor items")
		return
	}
	defer itemsCursor.Close(ctx)

	var items []bson.M
	if err := itemsCursor.All(ctx, &items); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to process items")
		return
	}

	// Get items already in manager's food courts
	var itemIDs []primitive.ObjectID
	for _, item := range items {
		if id, ok := item["_id"].(primitive.ObjectID); ok {
			itemIDs = append(itemIDs, id)
		}
	}

	fcItemsCursor, err := collections.foodCourtItems.Find(ctx, bson.M{
		"item_id":      bson.M{"$in": itemIDs},
		"foodcourt_id": bson.M{"$in": managerFoodCourtIDs},
	})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch FC items")
		return
	}
	defer fcItemsCursor.Close(ctx)

	var fcItems []bson.M
	fcItemsCursor.All(ctx, &fcItems)

	// Create lookup for FC items
	fcItemMap := make(map[string]bool) // key: "itemID_fcID"
	for _, fcItem := range fcItems {
		itemID := fcItem["item_id"].(primitive.ObjectID).Hex()
		fcID := fcItem["foodcourt_id"].(primitive.ObjectID).Hex()
		fcItemMap[itemID+"_"+fcID] = true
	}

	// Enhance items with FC status
	var enhancedItems []interface{}
	for _, item := range items {
		itemID := item["_id"].(primitive.ObjectID)

		// Check FC status for each manager's food court
		var fcStatus []interface{}
		for _, fc := range managerFoodCourts {
			fcID := fc["_id"].(primitive.ObjectID)
			isInFC := fcItemMap[itemID.Hex()+"_"+fcID.Hex()]

			fcStatus = append(fcStatus, bson.M{
				"foodCourtId":   fcID,
				"foodCourtName": fc["name"],
				"location":      fc["location"],
				"isInFoodCourt": isInFC,
			})
		}

		enhancedItem := bson.M{
			"id":              item["_id"],
			"name":            item["name"],
			"description":     item["description"],
			"basePrice":       item["basePrice"],
			"category":        item["category"],
			"isVeg":           item["isVeg"],
			"isSpecial":       item["isSpecial"],
			"createdAt":       item["createdAt"],
			"foodCourtStatus": fcStatus,
			"canManage":       len(managerFoodCourts) > 0,
		}
		enhancedItems = append(enhancedItems, enhancedItem)
	}

	response := bson.M{
		"items":      enhancedItems,
		"foodCourts": managerFoodCourts,
		"stats": bson.M{
			"totalItems":      len(items),
			"totalFoodCourts": len(managerFoodCourts),
			"vendorId":        manager.VendorID,
		},
	}

	utils.RespondSuccess(c, http.StatusOK, "Vendor items with FC status retrieved", response)
}

// Profile Management
// GetManagerProfile - Get manager profile with user and vendor details
func GetManagerProfile(c *gin.Context, db *mongo.Database) {
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
		users      *mongo.Collection
		managers   *mongo.Collection
		vendors    *mongo.Collection
		foodCourts *mongo.Collection
	}{
		users:      db.Collection("users"),
		managers:   db.Collection("managers"),
		vendors:    db.Collection("vendors"),
		foodCourts: db.Collection("foodcourts"),
	}

	// Get user details
	var user struct {
		ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name      string             `bson:"name" json:"name"`
		Email     string             `bson:"email" json:"email"`
		Role      string             `bson:"role" json:"role"`
		CreatedAt primitive.DateTime `bson:"createdAt" json:"createdAt"`
		UpdatedAt primitive.DateTime `bson:"updatedAt" json:"updatedAt"`
	}
	err = collections.users.FindOne(ctx, bson.M{"_id": userObjID}).Decode(&user)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	// Get manager details
	var manager struct {
		ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		UserID      primitive.ObjectID `bson:"user_id" json:"user_id"`
		VendorID    primitive.ObjectID `bson:"vendor_id" json:"vendor_id"`
		FoodCourtID primitive.ObjectID `bson:"foodcourt_id" json:"foodcourt_id"`
		ContactNo   string             `bson:"contact_no" json:"contact_no"`
		IsActive    bool               `bson:"isActive" json:"isActive"`
		CreatedAt   primitive.DateTime `bson:"createdAt" json:"createdAt"`
		UpdatedAt   primitive.DateTime `bson:"updatedAt" json:"updatedAt"`
	}
	err = collections.managers.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&manager)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Manager profile not found")
		return
	}

	// Get vendor details
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

	// Get food court details
	var foodCourt struct {
		ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name     string             `bson:"name" json:"name"`
		Location string             `bson:"location" json:"location"`
		IsOpen   bool               `bson:"isOpen" json:"isOpen"`
		Timings  string             `bson:"timings,omitempty" json:"timings,omitempty"`
	}
	err = collections.foodCourts.FindOne(ctx, bson.M{"_id": manager.FoodCourtID}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found")
		return
	}

	// Get other food courts managed by this manager
	otherFCsCursor, err := collections.managers.Find(ctx, bson.M{
		"user_id":      userObjID,
		"foodcourt_id": bson.M{"$ne": manager.FoodCourtID},
	})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch other food courts")
		return
	}
	defer otherFCsCursor.Close(ctx)

	var otherFoodCourts []interface{}
	for otherFCsCursor.Next(ctx) {
		var mgr struct {
			FoodCourtID primitive.ObjectID `bson:"foodcourt_id"`
		}
		if err := otherFCsCursor.Decode(&mgr); err == nil {
			var fc struct {
				ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
				Name     string             `bson:"name" json:"name"`
				Location string             `bson:"location" json:"location"`
			}
			if err := collections.foodCourts.FindOne(ctx, bson.M{"_id": mgr.FoodCourtID}).Decode(&fc); err == nil {
				otherFoodCourts = append(otherFoodCourts, fc)
			}
		}
	}

	// Get stats for dashboard
	itemsCollection := db.Collection("items")
	itemFoodCourtsCollection := db.Collection("itemfoodcourts")

	// Count items in vendor's catalog
	totalItems, _ := itemsCollection.CountDocuments(ctx, bson.M{"vendor_id": manager.VendorID})

	// Count items in manager's primary food court
	itemsInPrimaryFC, _ := itemFoodCourtsCollection.CountDocuments(ctx, bson.M{
		"foodcourt_id": manager.FoodCourtID,
		"item_id":      bson.M{"$in": getVendorItemIDs(ctx, itemsCollection, manager.VendorID)},
	})

	// Count total food courts managed
	totalManagedFCs, _ := collections.managers.CountDocuments(ctx, bson.M{"user_id": userObjID})

	response := gin.H{
		"user":             user,
		"manager":          manager,
		"vendor":           vendor,
		"primaryFoodCourt": foodCourt,
		"otherFoodCourts":  otherFoodCourts,
		"stats": gin.H{
			"totalItems":       totalItems,
			"itemsInPrimaryFC": itemsInPrimaryFC,
			"totalManagedFCs":  totalManagedFCs,
		},
	}

	utils.RespondSuccess(c, http.StatusOK, "Manager profile retrieved successfully", response)
}

// UpdateManagerProfile - Update manager profile (contact number and active status)
// UpdateManagerProfile - Update manager profile including basic user information
func UpdateManagerProfile(c *gin.Context, db *mongo.Database) {
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

	var request struct {
		// User fields
		Name  *string `json:"name,omitempty" validate:"omitempty,min=2,max=50"`
		Email *string `json:"email,omitempty" validate:"omitempty,email"`
		// Manager fields
		ContactNo *string `json:"contactNo,omitempty" validate:"omitempty,e164"`
		IsActive  *bool   `json:"isActive,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request data")
		return
	}

	// Validate at least one field is provided
	if request.Name == nil && request.Email == nil && request.ContactNo == nil && request.IsActive == nil {
		utils.RespondError(c, http.StatusBadRequest, "No fields to update")
		return
	}

	ctx := context.Background()
	collections := struct {
		users    *mongo.Collection
		managers *mongo.Collection
	}{
		users:    db.Collection("users"),
		managers: db.Collection("managers"),
	}

	// Start a session for transaction
	session, err := db.Client().StartSession()
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to start database session")
		return
	}
	defer session.EndSession(ctx)

	// Use transaction to ensure data consistency
	callback := func(sessCtx mongo.SessionContext) (interface{}, error) {
		// Build user update fields
		userUpdateFields := bson.M{
			"updatedAt": primitive.NewDateTimeFromTime(time.Now()),
		}

		if request.Name != nil {
			userUpdateFields["name"] = *request.Name
		}

		if request.Email != nil {
			// Check if email already exists for other users
			existingUser, err := collections.users.CountDocuments(sessCtx, bson.M{
				"email": *request.Email,
				"_id":   bson.M{"$ne": userObjID},
			})
			if err != nil {
				return nil, err
			}
			if existingUser > 0 {
				return nil, fmt.Errorf("email already exists")
			}
			userUpdateFields["email"] = *request.Email
		}

		// Update user if there are user fields to update
		if len(userUpdateFields) > 1 { // More than just updatedAt
			result, err := collections.users.UpdateOne(
				sessCtx,
				bson.M{"_id": userObjID},
				bson.M{"$set": userUpdateFields},
			)
			if err != nil {
				return nil, err
			}
			if result.MatchedCount == 0 {
				return nil, fmt.Errorf("user not found")
			}
		}

		// Build manager update fields
		managerUpdateFields := bson.M{
			"updatedAt": primitive.NewDateTimeFromTime(time.Now()),
		}

		if request.ContactNo != nil {
			managerUpdateFields["contact_no"] = *request.ContactNo
		}

		if request.IsActive != nil {
			managerUpdateFields["isActive"] = *request.IsActive
		}

		// Update manager if there are manager fields to update
		if len(managerUpdateFields) > 1 { // More than just updatedAt
			result, err := collections.managers.UpdateOne(
				sessCtx,
				bson.M{"user_id": userObjID},
				bson.M{"$set": managerUpdateFields},
			)
			if err != nil {
				return nil, err
			}
			if result.MatchedCount == 0 {
				return nil, fmt.Errorf("manager profile not found")
			}
		}

		return nil, nil
	}

	// Execute transaction
	_, err = session.WithTransaction(ctx, callback)
	if err != nil {
		if err.Error() == "email already exists" {
			utils.RespondError(c, http.StatusConflict, "Email already exists")
			return
		}
		if err.Error() == "user not found" {
			utils.RespondError(c, http.StatusNotFound, "User not found")
			return
		}
		if err.Error() == "manager profile not found" {
			utils.RespondError(c, http.StatusNotFound, "Manager profile not found")
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update profile: "+err.Error())
		return
	}

	// Get updated combined profile data
	var updatedUser struct {
		ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name      string             `bson:"name" json:"name"`
		Email     string             `bson:"email" json:"email"`
		Role      string             `bson:"role" json:"role"`
		CreatedAt primitive.DateTime `bson:"createdAt" json:"createdAt"`
		UpdatedAt primitive.DateTime `bson:"updatedAt" json:"updatedAt"`
	}
	err = collections.users.FindOne(ctx, bson.M{"_id": userObjID}).Decode(&updatedUser)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch updated user data")
		return
	}

	var updatedManager struct {
		ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		UserID      primitive.ObjectID `bson:"user_id" json:"user_id"`
		VendorID    primitive.ObjectID `bson:"vendor_id" json:"vendor_id"`
		FoodCourtID primitive.ObjectID `bson:"foodcourt_id" json:"foodcourt_id"`
		ContactNo   string             `bson:"contact_no" json:"contact_no"`
		IsActive    bool               `bson:"isActive" json:"isActive"`
		CreatedAt   primitive.DateTime `bson:"createdAt" json:"createdAt"`
		UpdatedAt   primitive.DateTime `bson:"updatedAt" json:"updatedAt"`
	}
	err = collections.managers.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&updatedManager)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch updated manager data")
		return
	}

	response := gin.H{
		"user":    updatedUser,
		"manager": updatedManager,
		"message": "Profile updated successfully",
	}

	utils.RespondSuccess(c, http.StatusOK, "Manager profile updated successfully", response)
}
