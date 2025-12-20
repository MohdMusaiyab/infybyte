package controllers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/MohdMusaiyab/infybyte/server/internal/models"
	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
)

type VendorProfileResponse struct {
	User           interface{}   `json:"user"`
	Vendor         interface{}   `json:"vendor"`
	Items          []interface{} `json:"items"`
	FoodCourts     []interface{} `json:"foodCourts"`
	Managers       []interface{} `json:"managers"`
	FoodCourtItems []interface{} `json:"foodCourtItems"`
}

func GetVendorProfile(c *gin.Context, db *mongo.Database) {
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
		foodCourtItems *mongo.Collection
	}{
		users:          db.Collection("users"),
		vendors:        db.Collection("vendors"),
		items:          db.Collection("items"),
		foodCourts:     db.Collection("foodcourts"),
		managers:       db.Collection("managers"),
		foodCourtItems: db.Collection("itemfoodcourts"),
	}

	var response VendorProfileResponse

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

	// Fetch Vendor Details
	var vendor struct {
		ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
		ShopName  string             `bson:"shopName" json:"shopName"`
		GST       string             `bson:"gst,omitempty" json:"gst,omitempty"`
		CreatedAt primitive.DateTime `bson:"createdAt" json:"createdAt"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor profile not found")
		return
	}
	response.Vendor = vendor

	// Fetch All Items for this Vendor
	itemsCursor, err := collections.items.Find(ctx, bson.M{"vendor_id": vendor.ID})
	if err == nil {
		defer itemsCursor.Close(ctx)
		itemsCursor.All(ctx, &response.Items)
	}

	// Fetch Food Courts the Vendor is part of
	var foodCourtIDs []primitive.ObjectID
	foodCourtsCursor, err := collections.foodCourts.Find(ctx, bson.M{"vendor_ids": vendor.ID})
	if err == nil {
		defer foodCourtsCursor.Close(ctx)
		var foodCourts []interface{}
		for foodCourtsCursor.Next(ctx) {
			var foodCourt struct {
				ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
				Name      string             `bson:"name" json:"name"`
				Location  string             `bson:"location" json:"location"`
				IsOpen    bool               `bson:"isOpen" json:"isOpen"`
				CreatedAt primitive.DateTime `bson:"createdAt" json:"createdAt"`
			}
			if err := foodCourtsCursor.Decode(&foodCourt); err == nil {
				foodCourts = append(foodCourts, foodCourt)
				foodCourtIDs = append(foodCourtIDs, foodCourt.ID)
			}
		}
		response.FoodCourts = foodCourts
	}

	// Fetch Managers for this Vendor
	managersCursor, err := collections.managers.Find(ctx, bson.M{"vendor_id": vendor.ID})
	if err == nil {
		defer managersCursor.Close(ctx)
		var managers []interface{}
		for managersCursor.Next(ctx) {
			var manager struct {
				ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
				ContactNo string             `bson:"contact_no" json:"contact_no"`
				IsActive  bool               `bson:"isActive" json:"isActive"`
				CreatedAt primitive.DateTime `bson:"createdAt" json:"createdAt"`
			}
			if err := managersCursor.Decode(&manager); err == nil {
				managers = append(managers, manager)
			}
		}
		response.Managers = managers
	}

	// Fetch Food Court Items for this Vendor's Items
	if len(response.Items) > 0 {
		var itemIDs []primitive.ObjectID
		for _, item := range response.Items {
			if itemMap, ok := item.(bson.M); ok {
				if id, exists := itemMap["_id"]; exists {
					if objID, ok := id.(primitive.ObjectID); ok {
						itemIDs = append(itemIDs, objID)
					}
				}
			}
		}

		if len(itemIDs) > 0 && len(foodCourtIDs) > 0 {
			foodCourtItemsCursor, err := collections.foodCourtItems.Find(ctx, bson.M{
				"item_id":      bson.M{"$in": itemIDs},
				"foodcourt_id": bson.M{"$in": foodCourtIDs},
			})
			if err == nil {
				defer foodCourtItemsCursor.Close(ctx)
				foodCourtItemsCursor.All(ctx, &response.FoodCourtItems)
			}
		}
	}

	utils.RespondSuccess(c, http.StatusOK, "Vendor profile retrieved successfully", response)
}

func UpdateVendorProfile(c *gin.Context, db *mongo.Database) {
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
		Name     *string `json:"name,omitempty"`
		Email    *string `json:"email,omitempty"`
		ShopName *string `json:"shopName,omitempty"`
		GST      *string `json:"gst,omitempty"`
	}

	if err := c.BindJSON(&updateData); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	ctx := context.Background()
	collections := struct {
		users   *mongo.Collection
		vendors *mongo.Collection
	}{
		users:   db.Collection("users"),
		vendors: db.Collection("vendors"),
	}

	// Update User fields if provided
	if updateData.Name != nil || updateData.Email != nil {
		userUpdate := bson.M{}
		if updateData.Name != nil {
			userUpdate["name"] = *updateData.Name
		}
		if updateData.Email != nil {
			userUpdate["email"] = *updateData.Email
		}
		userUpdate["updatedAt"] = primitive.NewDateTimeFromTime(time.Now())

		_, err := collections.users.UpdateOne(
			ctx,
			bson.M{"_id": userObjID},
			bson.M{"$set": userUpdate},
		)
		if err != nil {
			utils.RespondError(c, http.StatusInternalServerError, "Failed to update user profile")
			return
		}
	}

	// Update Vendor fields if provided
	if updateData.ShopName != nil || updateData.GST != nil {
		vendorUpdate := bson.M{}
		if updateData.ShopName != nil {
			vendorUpdate["shopName"] = *updateData.ShopName
		}
		if updateData.GST != nil {
			vendorUpdate["gst"] = *updateData.GST
		}
		vendorUpdate["updatedAt"] = primitive.NewDateTimeFromTime(time.Now())

		_, err := collections.vendors.UpdateOne(
			ctx,
			bson.M{"user_id": userObjID},
			bson.M{"$set": vendorUpdate},
		)
		if err != nil {
			utils.RespondError(c, http.StatusInternalServerError, "Failed to update vendor profile")
			return
		}
	}

	utils.RespondSuccess(c, http.StatusOK, "Profile updated successfully", nil)
}

func GetVendorProfileByID(c *gin.Context, db *mongo.Database) {
	vendorID := c.Param("id")
	vendorObjID, err := primitive.ObjectIDFromHex(vendorID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid vendor ID")
		return
	}

	ctx := context.Background()
	collections := struct {
		vendors        *mongo.Collection
		items          *mongo.Collection
		foodCourts     *mongo.Collection
		foodCourtItems *mongo.Collection
	}{
		vendors:        db.Collection("vendors"),
		items:          db.Collection("items"),
		foodCourts:     db.Collection("foodcourts"),
		foodCourtItems: db.Collection("itemfoodcourts"),
	}

	// Define response structure with enriched data
	type ItemFoodCourtDetail struct {
		ItemFoodCourtID primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		ItemID          primitive.ObjectID `bson:"item_id" json:"item_id"`
		FoodCourtID     primitive.ObjectID `bson:"foodcourt_id" json:"foodcourt_id"`
		Status          string             `bson:"status" json:"status"`
		Price           *float64           `bson:"price,omitempty" json:"price,omitempty"`
		TimeSlot        string             `bson:"timeSlot" json:"timeSlot"`
		IsActive        bool               `bson:"isActive" json:"isActive"`
		UpdatedAt       primitive.DateTime `bson:"updatedAt" json:"updatedAt"`
		
		// Item Details (joined)
		ItemName        string             `json:"item_name"`
		ItemDescription string             `json:"item_description,omitempty"`
		ItemBasePrice   float64            `json:"item_basePrice"`
		ItemCategory    string             `json:"item_category"`
		ItemIsVeg       bool               `json:"item_isVeg"`
		ItemIsSpecial   bool               `json:"item_isSpecial"`
		
		// Food Court Details (joined)
		FoodCourtName   string             `json:"foodcourt_name"`
		FoodCourtLocation string           `json:"foodcourt_location"`
		FoodCourtIsOpen bool               `json:"foodcourt_isOpen"`
		FoodCourtTimings *string           `json:"foodcourt_timings,omitempty"`
	}

	var response struct {
		Vendor struct {
			ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
			ShopName  string             `bson:"shopName" json:"shopName"`
			GST       string             `bson:"gst,omitempty" json:"gst,omitempty"`
			CreatedAt primitive.DateTime `bson:"createdAt" json:"createdAt"`
		} `json:"vendor"`
		ItemFoodCourtDetails []ItemFoodCourtDetail `json:"item_foodcourt_details"`
		FoodCourts           []interface{}         `json:"foodCourts"`
		Summary              struct {
			TotalItems       int `json:"total_items"`
			TotalLocations   int `json:"total_locations"`
			AvailableItems   int `json:"available_items"`
			SellingFastItems int `json:"selling_fast_items"`
		} `json:"summary"`
	}

	// Fetch Vendor Details
	var vendor struct {
		ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		ShopName  string             `bson:"shopName" json:"shopName"`
		GST       string             `bson:"gst,omitempty" json:"gst,omitempty"`
		CreatedAt primitive.DateTime `bson:"createdAt" json:"createdAt"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"_id": vendorObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}
	response.Vendor = vendor

	// Fetch Food Courts the Vendor is part of
	var foodCourtIDs []primitive.ObjectID
	var foodCourtMap = make(map[primitive.ObjectID]struct {
		Name     string
		Location string
		IsOpen   bool
		Timings  *string
	})
	
	foodCourtsCursor, err := collections.foodCourts.Find(ctx, bson.M{"vendor_ids": vendorObjID})
	if err == nil {
		defer foodCourtsCursor.Close(ctx)
		for foodCourtsCursor.Next(ctx) {
			var foodCourt struct {
				ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
				Name      string             `bson:"name" json:"name"`
				Location  string             `bson:"location" json:"location"`
				IsOpen    bool               `bson:"isOpen" json:"isOpen"`
				Timings   *string            `bson:"timings,omitempty" json:"timings,omitempty"`
			}
			if err := foodCourtsCursor.Decode(&foodCourt); err == nil {
				foodCourtIDs = append(foodCourtIDs, foodCourt.ID)
				foodCourtMap[foodCourt.ID] = struct {
					Name     string
					Location string
					IsOpen   bool
					Timings  *string
				}{
					Name:     foodCourt.Name,
					Location: foodCourt.Location,
					IsOpen:   foodCourt.IsOpen,
					Timings:  foodCourt.Timings,
				}
				
				// Add to response.FoodCourts
				response.FoodCourts = append(response.FoodCourts, map[string]interface{}{
					"id":       foodCourt.ID,
					"name":     foodCourt.Name,
					"location": foodCourt.Location,
					"isOpen":   foodCourt.IsOpen,
					"timings":  foodCourt.Timings,
				})
			}
		}
	}

	// If vendor has no food courts, return early
	if len(foodCourtIDs) == 0 {
		response.Summary.TotalLocations = 0
		utils.RespondSuccess(c, http.StatusOK, "Vendor profile retrieved successfully", response)
		return
	}

	// Fetch ALL item-foodcourt entries for this vendor's food courts
	// This includes ALL items (not just vendor's items) available in these food courts
	foodCourtItemsCursor, err := collections.foodCourtItems.Find(ctx, bson.M{
		"foodcourt_id": bson.M{"$in": foodCourtIDs},
	})
	if err == nil {
		defer foodCourtItemsCursor.Close(ctx)
		
		var itemIDs []primitive.ObjectID
		var itemFoodCourtMap = make(map[primitive.ObjectID][]bson.M)
		
		// First pass: collect all item IDs
		for foodCourtItemsCursor.Next(ctx) {
			var fci bson.M
			if err := foodCourtItemsCursor.Decode(&fci); err == nil {
				if itemID, ok := fci["item_id"].(primitive.ObjectID); ok {
					itemIDs = append(itemIDs, itemID)
					
					// Store the raw food court item data
					if _, exists := itemFoodCourtMap[itemID]; !exists {
						itemFoodCourtMap[itemID] = []bson.M{}
					}
					itemFoodCourtMap[itemID] = append(itemFoodCourtMap[itemID], fci)
				}
			}
		}
		
		// If we have items in food courts, fetch their details
		if len(itemIDs) > 0 {
			// Fetch items that belong to this vendor AND are in the itemIDs list
			itemsCursor, err := collections.items.Find(ctx, bson.M{
				"_id":       bson.M{"$in": itemIDs},
				"vendor_id": vendorObjID, // Only items owned by this vendor
			})
			if err == nil {
				defer itemsCursor.Close(ctx)
				
				var itemMap = make(map[primitive.ObjectID]bson.M)
				for itemsCursor.Next(ctx) {
					var item bson.M
					if err := itemsCursor.Decode(&item); err == nil {
						if itemID, ok := item["_id"].(primitive.ObjectID); ok {
							itemMap[itemID] = item
						}
					}
				}
				
				// Now combine item details with food court item details
				for itemID, itemDetails := range itemMap {
					// Get all food court entries for this item
					if fciList, exists := itemFoodCourtMap[itemID]; exists {
						for _, fci := range fciList {
							foodCourtID, ok := fci["foodcourt_id"].(primitive.ObjectID)
							if !ok {
								continue
							}
							
							// Get food court details
							fcDetails, fcExists := foodCourtMap[foodCourtID]
							if !fcExists {
								continue
							}
							
							// Create enriched item-foodcourt detail
							detail := ItemFoodCourtDetail{
								ItemFoodCourtID: fci["_id"].(primitive.ObjectID),
								ItemID:          itemID,
								FoodCourtID:     foodCourtID,
								Status:          fci["status"].(string),
								TimeSlot:        fci["timeSlot"].(string),
							}
							
							// Add price if exists
							if price, ok := fci["price"].(float64); ok {
								detail.Price = &price
							}
							
							// Add isActive if exists
							if isActive, ok := fci["isActive"].(bool); ok {
								detail.IsActive = isActive
							}
							
							// Add updatedAt if exists
							if updatedAt, ok := fci["updatedAt"].(primitive.DateTime); ok {
								detail.UpdatedAt = updatedAt
							}
							
							// Add item details
							detail.ItemName = itemDetails["name"].(string)
							if desc, ok := itemDetails["description"].(string); ok {
								detail.ItemDescription = desc
							}
							detail.ItemBasePrice = itemDetails["basePrice"].(float64)
							detail.ItemCategory = itemDetails["category"].(string)
							detail.ItemIsVeg = itemDetails["isVeg"].(bool)
							detail.ItemIsSpecial = itemDetails["isSpecial"].(bool)
							
							// Add food court details
							detail.FoodCourtName = fcDetails.Name
							detail.FoodCourtLocation = fcDetails.Location
							detail.FoodCourtIsOpen = fcDetails.IsOpen
							detail.FoodCourtTimings = fcDetails.Timings
							
							response.ItemFoodCourtDetails = append(response.ItemFoodCourtDetails, detail)
							
							// Update summary counters
							response.Summary.TotalItems++
							if detail.Status == "available" {
								response.Summary.AvailableItems++
							} else if detail.Status == "sellingfast" {
								response.Summary.SellingFastItems++
							}
						}
					}
				}
			}
		}
	}
	
	// Set summary
	response.Summary.TotalLocations = len(response.FoodCourts)
	
	utils.RespondSuccess(c, http.StatusOK, "Vendor profile retrieved successfully", response)
}
// =================================Vendor Item Management==================================
func GetVendorItems(c *gin.Context, db *mongo.Database) {
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
		vendors *mongo.Collection
		items   *mongo.Collection
	}{
		vendors: db.Collection("vendors"),
		items:   db.Collection("items"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Get all items for this vendor
	cursor, err := collections.items.Find(ctx, bson.M{"vendor_id": vendor.ID})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch items")
		return
	}
	defer cursor.Close(ctx)

	var items []struct {
		ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name        string             `bson:"name" json:"name"`
		Description string             `bson:"description,omitempty" json:"description,omitempty"`
		BasePrice   float64            `bson:"basePrice" json:"basePrice"`
		Category    string             `bson:"category" json:"category"`
		IsVeg       bool               `bson:"isVeg" json:"isVeg"`
		IsSpecial   bool               `bson:"isSpecial" json:"isSpecial"`
		CreatedAt   primitive.DateTime `bson:"createdAt" json:"createdAt"`
		UpdatedAt   primitive.DateTime `bson:"updatedAt" json:"updatedAt"`
	}

	if err := cursor.All(ctx, &items); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to process items")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Items retrieved successfully", items)
}

func CreateItem(c *gin.Context, db *mongo.Database) {
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

	var itemData struct {
		Name        string  `json:"name" validate:"required,min=2,max=100"`
		Description string  `json:"description,omitempty" validate:"omitempty,max=500"`
		BasePrice   float64 `json:"basePrice" validate:"required,gt=0"`
		Category    string  `json:"category" validate:"required,oneof=breakfast maincourse dessert beverage dosa northmeal paratha chinese combo"`
		IsVeg       bool    `json:"isVeg"`
		IsSpecial   bool    `json:"isSpecial"`
	}

	if err := c.BindJSON(&itemData); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	ctx := context.Background()
	collections := struct {
		vendors *mongo.Collection
		items   *mongo.Collection
	}{
		vendors: db.Collection("vendors"),
		items:   db.Collection("items"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Create item
	item := bson.M{
		"name":        itemData.Name,
		"description": itemData.Description,
		"basePrice":   itemData.BasePrice,
		"category":    itemData.Category,
		"isVeg":       itemData.IsVeg,
		"isSpecial":   itemData.IsSpecial,
		"vendor_id":   vendor.ID,
		"createdAt":   primitive.NewDateTimeFromTime(time.Now()),
		"updatedAt":   primitive.NewDateTimeFromTime(time.Now()),
	}

	result, err := collections.items.InsertOne(ctx, item)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create item")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, "Item created successfully", bson.M{"id": result.InsertedID})
}

func UpdateItem(c *gin.Context, db *mongo.Database) {
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

	itemID := c.Param("id")
	itemObjID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid item ID")
		return
	}

	var updateData struct {
		Name        *string  `json:"name,omitempty" validate:"omitempty,min=2,max=100"`
		Description *string  `json:"description,omitempty" validate:"omitempty,max=500"`
		BasePrice   *float64 `json:"basePrice,omitempty" validate:"omitempty,gt=0"`
		Category    *string  `json:"category,omitempty" validate:"omitempty,oneof=breakfast maincourse dessert beverage dosa northmeal paratha chinese combo"`
		IsVeg       *bool    `json:"isVeg,omitempty"`
		IsSpecial   *bool    `json:"isSpecial,omitempty"`
	}

	if err := c.BindJSON(&updateData); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	ctx := context.Background()
	collections := struct {
		vendors *mongo.Collection
		items   *mongo.Collection
	}{
		vendors: db.Collection("vendors"),
		items:   db.Collection("items"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Build update fields
	updateFields := bson.M{}
	if updateData.Name != nil {
		updateFields["name"] = *updateData.Name
	}
	if updateData.Description != nil {
		updateFields["description"] = *updateData.Description
	}
	if updateData.BasePrice != nil {
		updateFields["basePrice"] = *updateData.BasePrice
	}
	if updateData.Category != nil {
		updateFields["category"] = *updateData.Category
	}
	if updateData.IsVeg != nil {
		updateFields["isVeg"] = *updateData.IsVeg
	}
	if updateData.IsSpecial != nil {
		updateFields["isSpecial"] = *updateData.IsSpecial
	}

	if len(updateFields) == 0 {
		utils.RespondError(c, http.StatusBadRequest, "No valid fields to update")
		return
	}

	updateFields["updatedAt"] = primitive.NewDateTimeFromTime(time.Now())

	// Update item only if it belongs to this vendor
	result, err := collections.items.UpdateOne(
		ctx,
		bson.M{"_id": itemObjID, "vendor_id": vendor.ID},
		bson.M{"$set": updateFields},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update item")
		return
	}

	if result.MatchedCount == 0 {
		utils.RespondError(c, http.StatusNotFound, "Item not found or access denied")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Item updated successfully", nil)
}

func DeleteItem(c *gin.Context, db *mongo.Database) {
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

	itemID := c.Param("id")
	itemObjID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid item ID")
		return
	}

	ctx := context.Background()
	collections := struct {
		vendors *mongo.Collection
		items   *mongo.Collection
	}{
		vendors: db.Collection("vendors"),
		items:   db.Collection("items"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Delete item only if it belongs to this vendor
	result, err := collections.items.DeleteOne(
		ctx,
		bson.M{"_id": itemObjID, "vendor_id": vendor.ID},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete item")
		return
	}

	if result.DeletedCount == 0 {
		utils.RespondError(c, http.StatusNotFound, "Item not found or access denied")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Item deleted successfully", nil)
}

func GetVendorItem(c *gin.Context, db *mongo.Database) {
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

	itemID := c.Param("id")
	itemObjID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid item ID")
		return
	}

	ctx := context.Background()
	collections := struct {
		vendors *mongo.Collection
		items   *mongo.Collection
	}{
		vendors: db.Collection("vendors"),
		items:   db.Collection("items"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Get the specific item
	var item struct {
		ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name        string             `bson:"name" json:"name"`
		Description string             `bson:"description,omitempty" json:"description,omitempty"`
		BasePrice   float64            `bson:"basePrice" json:"basePrice"`
		Category    string             `bson:"category" json:"category"`
		IsVeg       bool               `bson:"isVeg" json:"isVeg"`
		IsSpecial   bool               `bson:"isSpecial" json:"isSpecial"`
		CreatedAt   primitive.DateTime `bson:"createdAt" json:"createdAt"`
		UpdatedAt   primitive.DateTime `bson:"updatedAt" json:"updatedAt"`
	}

	err = collections.items.FindOne(ctx, bson.M{"_id": itemObjID, "vendor_id": vendor.ID}).Decode(&item)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			utils.RespondError(c, http.StatusNotFound, "Item not found")
		} else {
			utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch item")
		}
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Item retrieved successfully", item)
}

// ================================Food Court Items=======================
func GetVendorFoodCourtItems(c *gin.Context, db *mongo.Database) {
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
		vendors        *mongo.Collection
		foodCourtItems *mongo.Collection
		foodCourts     *mongo.Collection
		items          *mongo.Collection
	}{
		vendors:        db.Collection("vendors"),
		foodCourtItems: db.Collection("itemfoodcourts"),
		// foodCourts:     db.Collection("foodcourts"),
		// items:          db.Collection("items"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Get all food court items for this vendor's items
	pipeline := []bson.M{
		{"$lookup": bson.M{
			"from":         "items",
			"localField":   "item_id",
			"foreignField": "_id",
			"as":           "item",
		}},
		{"$unwind": "$item"},
		{"$match": bson.M{"item.vendor_id": vendor.ID}},
		{"$lookup": bson.M{
			"from":         "foodcourts",
			"localField":   "foodcourt_id",
			"foreignField": "_id",
			"as":           "foodcourt",
		}},
		{"$unwind": "$foodcourt"},
		{"$project": bson.M{
			"_id":           1,
			"item_id":       1,
			"itemName":      "$item.name",
			"foodcourt_id":  1,
			"foodcourtName": "$foodcourt.name",
			"location":      "$foodcourt.location",
			"status":        1,
			"price":         1,
			"isActive":      1,
			"timeSlot":      1,
			"createdAt":     1,
			"updatedAt":     1,
		}},
	}

	cursor, err := collections.foodCourtItems.Aggregate(ctx, pipeline)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch food court items")
		return
	}
	defer cursor.Close(ctx)

	var foodCourtItems []bson.M
	if err := cursor.All(ctx, &foodCourtItems); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to process food court items")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Food court items retrieved successfully", foodCourtItems)
}

func CreateFoodCourtItem(c *gin.Context, db *mongo.Database) {
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

	var itemData struct {
		ItemID      primitive.ObjectID `json:"itemId" validate:"required"`
		FoodCourtID primitive.ObjectID `json:"foodCourtId" validate:"required"`
		Status      string             `json:"status" validate:"required,oneof=available notavailable sellingfast finishingsoon"`
		Price       *float64           `json:"price,omitempty"`
		TimeSlot    string             `json:"timeSlot" validate:"required,oneof=breakfast lunch snacks dinner"`
	}

	if err := c.BindJSON(&itemData); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	ctx := context.Background()
	collections := struct {
		vendors        *mongo.Collection
		items          *mongo.Collection
		foodCourts     *mongo.Collection
		foodCourtItems *mongo.Collection
	}{
		vendors:        db.Collection("vendors"),
		items:          db.Collection("items"),
		foodCourts:     db.Collection("foodcourts"),
		foodCourtItems: db.Collection("itemfoodcourts"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Verify item belongs to vendor
	var item struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.items.FindOne(ctx, bson.M{"_id": itemData.ItemID, "vendor_id": vendor.ID}).Decode(&item)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Item not found or access denied")
		return
	}

	// Verify food court exists and vendor is part of it
	var foodCourt struct {
		VendorIDs []primitive.ObjectID `bson:"vendor_ids"`
	}
	err = collections.foodCourts.FindOne(ctx, bson.M{"_id": itemData.FoodCourtID}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found")
		return
	}

	// Check if vendor is part of this food court
	vendorInFoodCourt := false
	for _, vid := range foodCourt.VendorIDs {
		if vid == vendor.ID {
			vendorInFoodCourt = true
			break
		}
	}
	if !vendorInFoodCourt {
		utils.RespondError(c, http.StatusForbidden, "Vendor is not part of this food court")
		return
	}

	// Check if item already exists in this food court
	existing, err := collections.foodCourtItems.CountDocuments(ctx, bson.M{
		"item_id":      itemData.ItemID,
		"foodcourt_id": itemData.FoodCourtID,
	})
	if err == nil && existing > 0 {
		utils.RespondError(c, http.StatusConflict, "Item already exists in this food court")
		return
	}

	// Create food court item
	foodCourtItem := bson.M{
		"item_id":      itemData.ItemID,
		"foodcourt_id": itemData.FoodCourtID,
		"status":       itemData.Status,
		"price":        itemData.Price,
		"timeSlot":     itemData.TimeSlot,
		"isActive":     true,
		"createdAt":    primitive.NewDateTimeFromTime(time.Now()),
		"updatedAt":    primitive.NewDateTimeFromTime(time.Now()),
	}

	result, err := collections.foodCourtItems.InsertOne(ctx, foodCourtItem)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to add item to food court")
		return
	}
	// ✅ NEW: Fetch the created document for broadcasting
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

func UpdateFoodCourtItem(c *gin.Context, db *mongo.Database) {
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

	foodCourtItemID := c.Param("id")
	foodCourtItemObjID, err := primitive.ObjectIDFromHex(foodCourtItemID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid food court item ID")
		return
	}

	var updateData struct {
		Status   *string  `json:"status,omitempty" validate:"omitempty,oneof=available notavailable sellingfast finishingsoon"`
		Price    *float64 `json:"price,omitempty"`
		TimeSlot *string  `json:"timeSlot,omitempty" validate:"omitempty,oneof=breakfast lunch snacks dinner"`
		IsActive *bool    `json:"isActive,omitempty"`
	}

	if err := c.BindJSON(&updateData); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	ctx := context.Background()
	collections := struct {
		vendors        *mongo.Collection
		foodCourtItems *mongo.Collection
		items          *mongo.Collection
	}{
		vendors:        db.Collection("vendors"),
		foodCourtItems: db.Collection("itemfoodcourts"),
		items:          db.Collection("items"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Build update fields
	updateFields := bson.M{}
	if updateData.Status != nil {
		updateFields["status"] = *updateData.Status
	}
	if updateData.Price != nil {
		updateFields["price"] = *updateData.Price
	}
	if updateData.TimeSlot != nil {
		updateFields["timeSlot"] = *updateData.TimeSlot
	}
	if updateData.IsActive != nil {
		updateFields["isActive"] = *updateData.IsActive
	}

	if len(updateFields) == 0 {
		utils.RespondError(c, http.StatusBadRequest, "No valid fields to update")
		return
	}

	updateFields["updatedAt"] = primitive.NewDateTimeFromTime(time.Now())

	// Update only if the item belongs to this vendor
	pipeline := []bson.M{
		{"$match": bson.M{"_id": foodCourtItemObjID}},
		{"$lookup": bson.M{
			"from":         "items",
			"localField":   "item_id",
			"foreignField": "_id",
			"as":           "item",
		}},
		{"$unwind": "$item"},
		{"$match": bson.M{"item.vendor_id": vendor.ID}},
	}

	cursor, err := collections.foodCourtItems.Aggregate(ctx, pipeline)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to verify ownership")
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil || len(results) == 0 {
		utils.RespondError(c, http.StatusNotFound, "Food court item not found or access denied")
		return
	}

	// Perform the update
	result, err := collections.foodCourtItems.UpdateOne(
		ctx,
		bson.M{"_id": foodCourtItemObjID},
		bson.M{"$set": updateFields},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update food court item")
		return
	}

	if result.MatchedCount == 0 {
		utils.RespondError(c, http.StatusNotFound, "Food court item not found")
		return
	}

	// ✅ NEW: Fetch the updated document to broadcast
	var updatedItem models.ItemFoodCourt
	err = collections.foodCourtItems.FindOne(ctx, bson.M{"_id": foodCourtItemObjID}).Decode(&updatedItem)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch updated item")
		return
	}

	// ✅ NEW: Broadcast the update to all connected clients
	utils.BroadcastItemFoodCourtUpdate(updatedItem, "update")

	utils.RespondSuccess(c, http.StatusOK, "Food court item updated successfully", gin.H{
		"updatedItem": updatedItem,
	})
}

func DeleteFoodCourtItem(c *gin.Context, db *mongo.Database) {
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

	itemID := c.Query("itemId")
	foodCourtID := c.Query("foodCourtId")

	if itemID == "" || foodCourtID == "" {
		utils.RespondError(c, http.StatusBadRequest, "Both itemId and foodCourtId are required")
		return
	}

	itemObjID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid item ID")
		return
	}

	foodCourtObjID, err := primitive.ObjectIDFromHex(foodCourtID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid food court ID")
		return
	}

	ctx := context.Background()
	collections := struct {
		vendors        *mongo.Collection
		foodCourtItems *mongo.Collection
		items          *mongo.Collection
		foodCourts     *mongo.Collection
	}{
		vendors:        db.Collection("vendors"),
		foodCourtItems: db.Collection("itemfoodcourts"),
		items:          db.Collection("items"),
		foodCourts:     db.Collection("foodcourts"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Verify vendor owns the item AND is part of the food court
	var item struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.items.FindOne(ctx, bson.M{"_id": itemObjID, "vendor_id": vendor.ID}).Decode(&item)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Item not found or access denied")
		return
	}

	var foodCourt struct {
		VendorIDs []primitive.ObjectID `bson:"vendor_ids"`
	}
	err = collections.foodCourts.FindOne(ctx, bson.M{"_id": foodCourtObjID}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found")
		return
	}

	// Check if vendor is part of this food court
	vendorInFoodCourt := false
	for _, vid := range foodCourt.VendorIDs {
		if vid == vendor.ID {
			vendorInFoodCourt = true
			break
		}
	}
	if !vendorInFoodCourt {
		utils.RespondError(c, http.StatusForbidden, "Vendor is not part of this food court")
		return
	}

	// Delete the food court item association
	// ✅ NEW: Fetch the item to be deleted for broadcasting
	var itemToDelete models.ItemFoodCourt
	err = collections.foodCourtItems.FindOne(ctx, bson.M{
		"item_id":      itemObjID,
		"foodcourt_id": foodCourtObjID,
	}).Decode(&itemToDelete)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court item association not found")
		return
	}

	// Delete the food court item association
	result, err := collections.foodCourtItems.DeleteOne(
		ctx,
		bson.M{
			"item_id":      itemObjID,
			"foodcourt_id": foodCourtObjID,
		},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete food court item")
		return
	}

	if result.DeletedCount == 0 {
		utils.RespondError(c, http.StatusNotFound, "Food court item association not found")
		return
	}

	// ✅ NEW: Broadcast the deletion to all connected clients
	utils.BroadcastItemFoodCourtUpdate(itemToDelete, "delete")

	utils.RespondSuccess(c, http.StatusOK, "Item removed from food court successfully", nil)
}
func GetVendorFoodCourts(c *gin.Context, db *mongo.Database) {
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
		vendors    *mongo.Collection
		foodCourts *mongo.Collection
	}{
		vendors:    db.Collection("vendors"),
		foodCourts: db.Collection("foodcourts"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Get all food courts this vendor is part of
	cursor, err := collections.foodCourts.Find(ctx, bson.M{"vendor_ids": vendor.ID})
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch food courts")
		return
	}
	defer cursor.Close(ctx)

	var foodCourts []struct {
		ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name      string             `bson:"name" json:"name"`
		Location  string             `bson:"location" json:"location"`
		Timings   string             `bson:"timings,omitempty" json:"timings,omitempty"`
		IsOpen    bool               `bson:"isOpen" json:"isOpen"`
		Weekends  bool               `bson:"weekends" json:"weekends"`
		Weekdays  bool               `bson:"weekdays" json:"weekdays"`
		CreatedAt primitive.DateTime `bson:"createdAt" json:"createdAt"`
	}

	if err := cursor.All(ctx, &foodCourts); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to process food courts")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Food courts retrieved successfully", foodCourts)
}
func GetItemFoodCourts(c *gin.Context, db *mongo.Database) {
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

	itemID := c.Param("id")
	itemObjID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid item ID")
		return
	}

	ctx := context.Background()
	collections := struct {
		vendors        *mongo.Collection
		items          *mongo.Collection
		foodCourtItems *mongo.Collection
		foodCourts     *mongo.Collection
	}{
		vendors:        db.Collection("vendors"),
		items:          db.Collection("items"),
		foodCourtItems: db.Collection("itemfoodcourts"),
		foodCourts:     db.Collection("foodcourts"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Verify item belongs to vendor
	var item struct {
		ID   primitive.ObjectID `bson:"_id"`
		Name string             `bson:"name"`
	}
	err = collections.items.FindOne(ctx, bson.M{"_id": itemObjID, "vendor_id": vendor.ID}).Decode(&item)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Item not found or access denied")
		return
	}

	// Get all food court associations for this item
	pipeline := []bson.M{
		{"$match": bson.M{"item_id": itemObjID}},
		{"$lookup": bson.M{
			"from":         "foodcourts",
			"localField":   "foodcourt_id",
			"foreignField": "_id",
			"as":           "foodcourt",
		}},
		{"$unwind": "$foodcourt"},
		{"$project": bson.M{
			"id":            "$_id",
			"_id":           0,
			"status":        1,
			"price":         1,
			"timeSlot":      1,
			"isActive":      1,
			"createdAt":     1,
			"updatedAt":     1,
			"foodCourtId":   "$foodcourt._id",
			"foodCourtName": "$foodcourt.name",
			"location":      "$foodcourt.location",
			"isOpen":        "$foodcourt.isOpen",
			"timings":       "$foodcourt.timings",
		}},
	}

	cursor, err := collections.foodCourtItems.Aggregate(ctx, pipeline)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch item food courts")
		return
	}
	defer cursor.Close(ctx)

	var foodCourtAssociations []bson.M
	if err := cursor.All(ctx, &foodCourtAssociations); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to process item food courts")
		return
	}

	response := struct {
		Item       interface{} `json:"item"`
		FoodCourts interface{} `json:"foodCourts"`
	}{
		Item: bson.M{
			"id":   item.ID,
			"name": item.Name,
		},
		FoodCourts: foodCourtAssociations,
	}

	utils.RespondSuccess(c, http.StatusOK, "Item food courts retrieved successfully", response)
}

// =============================Manager Management==============================
func GetVendorManagers(c *gin.Context, db *mongo.Database) {
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
		vendors  *mongo.Collection
		managers *mongo.Collection
		users    *mongo.Collection
	}{
		vendors:  db.Collection("vendors"),
		managers: db.Collection("managers"),
		// users:    db.Collection("users"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Get all managers for this vendor with user details
	pipeline := []bson.M{
		{"$match": bson.M{"vendor_id": vendor.ID}},
		{"$lookup": bson.M{
			"from":         "users",
			"localField":   "user_id",
			"foreignField": "_id",
			"as":           "user",
		}},
		{"$unwind": "$user"},
		{"$project": bson.M{
			"_id":        1,
			"user_id":    1,
			"userName":   "$user.name",
			"userEmail":  "$user.email",
			"contact_no": 1,
			"isActive":   1,
			"createdAt":  1,
			"updatedAt":  1,
		}},
	}

	cursor, err := collections.managers.Aggregate(ctx, pipeline)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch managers")
		return
	}
	defer cursor.Close(ctx)

	var managers []bson.M
	if err := cursor.All(ctx, &managers); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to process managers")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Managers retrieved successfully", managers)
}

func AddManager(c *gin.Context, db *mongo.Database) {
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

	var managerData struct {
		UserID      primitive.ObjectID `json:"userId" validate:"required"`
		ContactNo   string             `json:"contactNo" validate:"required,e164"`
		FoodCourtID primitive.ObjectID `json:"foodCourtId" validate:"required"`
	}

	if err := c.BindJSON(&managerData); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	ctx := context.Background()
	collections := struct {
		vendors    *mongo.Collection
		managers   *mongo.Collection
		users      *mongo.Collection
		foodCourts *mongo.Collection
	}{
		vendors:    db.Collection("vendors"),
		managers:   db.Collection("managers"),
		users:      db.Collection("users"),
		foodCourts: db.Collection("foodcourts"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Verify user exists
	var user struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.users.FindOne(ctx, bson.M{"_id": managerData.UserID}).Decode(&user)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	// Verify food court exists and vendor is part of it
	var foodCourt struct {
		VendorIDs []primitive.ObjectID `bson:"vendor_ids"`
	}
	err = collections.foodCourts.FindOne(ctx, bson.M{"_id": managerData.FoodCourtID}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found")
		return
	}

	// Check if vendor is part of this food court
	vendorInFoodCourt := false
	for _, vid := range foodCourt.VendorIDs {
		if vid == vendor.ID {
			vendorInFoodCourt = true
			break
		}
	}
	if !vendorInFoodCourt {
		utils.RespondError(c, http.StatusForbidden, "Vendor is not part of this food court")
		return
	}

	// Check if manager already exists for this vendor
	existing, err := collections.managers.CountDocuments(ctx, bson.M{
		"user_id":   managerData.UserID,
		"vendor_id": vendor.ID,
	})
	if err == nil && existing > 0 {
		utils.RespondError(c, http.StatusConflict, "Manager already exists for this vendor")
		return
	}

	// Create manager
	manager := bson.M{
		"user_id":      managerData.UserID,
		"vendor_id":    vendor.ID,
		"foodcourt_id": managerData.FoodCourtID,
		"contact_no":   managerData.ContactNo,
		"isActive":     true,
		"createdAt":    primitive.NewDateTimeFromTime(time.Now()),
		"updatedAt":    primitive.NewDateTimeFromTime(time.Now()),
	}

	result, err := collections.managers.InsertOne(ctx, manager)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to add manager")
		return
	}
	// Update user role to manager
	_, err = collections.users.UpdateOne(
		ctx,
		bson.M{"_id": managerData.UserID},
		bson.M{"$set": bson.M{
			"role":      "manager",
			"updatedAt": primitive.NewDateTimeFromTime(time.Now()),
		}},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update user role")
		return
	}
	utils.RespondSuccess(c, http.StatusCreated, "Manager added successfully", bson.M{"id": result.InsertedID})
}
func UpdateManager(c *gin.Context, db *mongo.Database) {
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

	managerID := c.Param("id")
	managerObjID, err := primitive.ObjectIDFromHex(managerID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid manager ID")
		return
	}

	var updateData struct {
		ContactNo   *string             `json:"contactNo,omitempty" validate:"omitempty,e164"`
		IsActive    *bool               `json:"isActive,omitempty"`
		FoodCourtID *primitive.ObjectID `json:"foodCourtId,omitempty"`
	}

	if err := c.BindJSON(&updateData); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	ctx := context.Background()
	collections := struct {
		vendors    *mongo.Collection
		managers   *mongo.Collection
		foodCourts *mongo.Collection
	}{
		vendors:    db.Collection("vendors"),
		managers:   db.Collection("managers"),
		foodCourts: db.Collection("foodcourts"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Verify food court if provided
	if updateData.FoodCourtID != nil {
		var foodCourt struct {
			VendorIDs []primitive.ObjectID `bson:"vendor_ids"`
		}
		err = collections.foodCourts.FindOne(ctx, bson.M{"_id": *updateData.FoodCourtID}).Decode(&foodCourt)
		if err != nil {
			utils.RespondError(c, http.StatusNotFound, "Food court not found")
			return
		}

		// Check if vendor is part of this food court
		vendorInFoodCourt := false
		for _, vid := range foodCourt.VendorIDs {
			if vid == vendor.ID {
				vendorInFoodCourt = true
				break
			}
		}
		if !vendorInFoodCourt {
			utils.RespondError(c, http.StatusForbidden, "Vendor is not part of this food court")
			return
		}
	}

	// Build update fields
	updateFields := bson.M{}
	if updateData.ContactNo != nil {
		updateFields["contact_no"] = *updateData.ContactNo
	}
	if updateData.IsActive != nil {
		updateFields["isActive"] = *updateData.IsActive
	}
	if updateData.FoodCourtID != nil {
		updateFields["foodcourt_id"] = *updateData.FoodCourtID
	}

	if len(updateFields) == 0 {
		utils.RespondError(c, http.StatusBadRequest, "No valid fields to update")
		return
	}

	updateFields["updatedAt"] = primitive.NewDateTimeFromTime(time.Now())

	// Update manager only if it belongs to this vendor
	result, err := collections.managers.UpdateOne(
		ctx,
		bson.M{"_id": managerObjID, "vendor_id": vendor.ID},
		bson.M{"$set": updateFields},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update manager")
		return
	}

	if result.MatchedCount == 0 {
		utils.RespondError(c, http.StatusNotFound, "Manager not found or access denied")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Manager updated successfully", nil)
}

func RemoveManager(c *gin.Context, db *mongo.Database) {
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

	managerID := c.Param("id")
	managerObjID, err := primitive.ObjectIDFromHex(managerID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid manager ID")
		return
	}

	ctx := context.Background()
	collections := struct {
		vendors  *mongo.Collection
		managers *mongo.Collection
	}{
		vendors:  db.Collection("vendors"),
		managers: db.Collection("managers"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Delete manager only if it belongs to this vendor
	result, err := collections.managers.DeleteOne(
		ctx,
		bson.M{"_id": managerObjID, "vendor_id": vendor.ID},
	)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to remove manager")
		return
	}

	if result.DeletedCount == 0 {
		utils.RespondError(c, http.StatusNotFound, "Manager not found or access denied")
		return
	}
	// Get manager details to find the user ID
	var manager struct {
		UserID primitive.ObjectID `bson:"user_id"`
	}
	err = collections.managers.FindOne(ctx, bson.M{"_id": managerObjID}).Decode(&manager)
	if err == nil {
		// Update user role back to user
		_, err = db.Collection("users").UpdateOne(
			ctx,
			bson.M{"_id": manager.UserID},
			bson.M{"$set": bson.M{
				"role":      "user",
				"updatedAt": primitive.NewDateTimeFromTime(time.Now()),
			}},
		)
		if err != nil {
			utils.RespondError(c, http.StatusInternalServerError, "Failed to update user role")
			return
		}
	}

	utils.RespondSuccess(c, http.StatusOK, "Manager removed successfully", nil)
}

func GetAllUsersForManager(c *gin.Context, db *mongo.Database) {
	// Get vendor info to ensure they're authenticated
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

	// Verify vendor exists
	vendorCollection := db.Collection("vendors")
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = vendorCollection.FindOne(context.TODO(), bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// pagination params
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

	// Build filter query
	filter := bson.M{}
	if searchEmail != "" {
		filter["email"] = bson.M{
			"$regex":   searchEmail,
			"$options": "i",
		}
	}

	// projection (exclude password and sensitive fields)
	findOptions := options.Find().
		SetProjection(bson.M{
			"password": 0,
			"role":     0, // Exclude role for vendor access
		}).
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"createdAt": -1})

	// fetch users with filter
	cursor, err := collection.Find(context.TODO(), filter, findOptions)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch users")
		return
	}
	defer cursor.Close(context.TODO())

	var users []struct {
		ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name      string             `bson:"name" json:"name"`
		Email     string             `bson:"email" json:"email"`
		CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	}

	if err := cursor.All(context.TODO(), &users); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Error decoding users")
		return
	}

	// count total docs with filter
	total, err := collection.CountDocuments(context.TODO(), filter)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to count users")
		return
	}

	// response
	utils.RespondSuccess(c, http.StatusOK, "Users fetched successfully", gin.H{
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

func GetVendorManager(c *gin.Context, db *mongo.Database) {
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

	managerID := c.Param("id")
	managerObjID, err := primitive.ObjectIDFromHex(managerID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid manager ID")
		return
	}

	ctx := context.Background()
	collections := struct {
		vendors  *mongo.Collection
		managers *mongo.Collection
		users    *mongo.Collection
	}{
		vendors:  db.Collection("vendors"),
		managers: db.Collection("managers"),
		users:    db.Collection("users"),
	}

	// Get vendor ID from user ID
	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	// Get manager with user details and food court info
	pipeline := []bson.M{
		{"$match": bson.M{"_id": managerObjID, "vendor_id": vendor.ID}},
		{"$lookup": bson.M{
			"from":         "users",
			"localField":   "user_id",
			"foreignField": "_id",
			"as":           "user",
		}},
		{"$unwind": "$user"},
		{"$lookup": bson.M{
			"from":         "foodcourts",
			"localField":   "foodcourt_id",
			"foreignField": "_id",
			"as":           "foodcourt",
		}},
		{"$unwind": bson.M{"path": "$foodcourt", "preserveNullAndEmptyArrays": true}},
		{"$project": bson.M{
			"id":            "$_id",
			"_id":           0,
			"user_id":       1,
			"userName":      "$user.name",
			"userEmail":     "$user.email",
			"contact_no":    1,
			"isActive":      1,
			"foodCourtId":   "$foodcourt._id",
			"foodCourtName": "$foodcourt.name",
			"location":      "$foodcourt.location",
			"createdAt":     1,
			"updatedAt":     1,
		}},
	}

	cursor, err := collections.managers.Aggregate(ctx, pipeline)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch manager")
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to process manager data")
		return
	}

	if len(results) == 0 {
		utils.RespondError(c, http.StatusNotFound, "Manager not found or access denied")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Manager retrieved successfully", results[0])
}
