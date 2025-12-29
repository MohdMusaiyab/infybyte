package controllers

import (
	"context"
	"net/http"
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

	itemsCursor, err := collections.items.Find(ctx, bson.M{"vendor_id": vendor.ID})
	if err == nil {
		defer itemsCursor.Close(ctx)
		itemsCursor.All(ctx, &response.Items)
	}

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

	type ItemFoodCourtDetail struct {
		ItemFoodCourtID primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		ItemID          primitive.ObjectID `bson:"item_id" json:"item_id"`
		FoodCourtID     primitive.ObjectID `bson:"foodcourt_id" json:"foodcourt_id"`
		Status          string             `bson:"status" json:"status"`
		Price           *float64           `bson:"price,omitempty" json:"price,omitempty"`
		TimeSlot        string             `bson:"timeSlot" json:"timeSlot"`
		IsActive        bool               `bson:"isActive" json:"isActive"`
		UpdatedAt       primitive.DateTime `bson:"updatedAt" json:"updatedAt"`

		ItemName        string  `json:"item_name"`
		ItemDescription string  `json:"item_description,omitempty"`
		ItemBasePrice   float64 `json:"item_basePrice"`
		ItemCategory    string  `json:"item_category"`
		ItemIsVeg       bool    `json:"item_isVeg"`
		ItemIsSpecial   bool    `json:"item_isSpecial"`

		FoodCourtName     string  `json:"foodcourt_name"`
		FoodCourtLocation string  `json:"foodcourt_location"`
		FoodCourtIsOpen   bool    `json:"foodcourt_isOpen"`
		FoodCourtTimings  *string `json:"foodcourt_timings,omitempty"`
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
				ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
				Name     string             `bson:"name" json:"name"`
				Location string             `bson:"location" json:"location"`
				IsOpen   bool               `bson:"isOpen" json:"isOpen"`
				Timings  *string            `bson:"timings,omitempty" json:"timings,omitempty"`
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

	if len(foodCourtIDs) == 0 {
		response.Summary.TotalLocations = 0
		utils.RespondSuccess(c, http.StatusOK, "Vendor profile retrieved successfully", response)
		return
	}

	foodCourtItemsCursor, err := collections.foodCourtItems.Find(ctx, bson.M{
		"foodcourt_id": bson.M{"$in": foodCourtIDs},
	})
	if err == nil {
		defer foodCourtItemsCursor.Close(ctx)

		var itemIDs []primitive.ObjectID
		var itemFoodCourtMap = make(map[primitive.ObjectID][]bson.M)

		for foodCourtItemsCursor.Next(ctx) {
			var fci bson.M
			if err := foodCourtItemsCursor.Decode(&fci); err == nil {
				if itemID, ok := fci["item_id"].(primitive.ObjectID); ok {
					itemIDs = append(itemIDs, itemID)

					if _, exists := itemFoodCourtMap[itemID]; !exists {
						itemFoodCourtMap[itemID] = []bson.M{}
					}
					itemFoodCourtMap[itemID] = append(itemFoodCourtMap[itemID], fci)
				}
			}
		}

		if len(itemIDs) > 0 {

			itemsCursor, err := collections.items.Find(ctx, bson.M{
				"_id":       bson.M{"$in": itemIDs},
				"vendor_id": vendorObjID,
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

				for itemID, itemDetails := range itemMap {

					if fciList, exists := itemFoodCourtMap[itemID]; exists {
						for _, fci := range fciList {
							foodCourtID, ok := fci["foodcourt_id"].(primitive.ObjectID)
							if !ok {
								continue
							}

							fcDetails, fcExists := foodCourtMap[foodCourtID]
							if !fcExists {
								continue
							}

							detail := ItemFoodCourtDetail{
								ItemFoodCourtID: fci["_id"].(primitive.ObjectID),
								ItemID:          itemID,
								FoodCourtID:     foodCourtID,
								Status:          fci["status"].(string),
								TimeSlot:        fci["timeSlot"].(string),
							}

							if price, ok := fci["price"].(float64); ok {
								detail.Price = &price
							}

							if isActive, ok := fci["isActive"].(bool); ok {
								detail.IsActive = isActive
							}

							if updatedAt, ok := fci["updatedAt"].(primitive.DateTime); ok {
								detail.UpdatedAt = updatedAt
							}

							detail.ItemName = itemDetails["name"].(string)
							if desc, ok := itemDetails["description"].(string); ok {
								detail.ItemDescription = desc
							}
							detail.ItemBasePrice = itemDetails["basePrice"].(float64)
							detail.ItemCategory = itemDetails["category"].(string)
							detail.ItemIsVeg = itemDetails["isVeg"].(bool)
							detail.ItemIsSpecial = itemDetails["isSpecial"].(bool)

							detail.FoodCourtName = fcDetails.Name
							detail.FoodCourtLocation = fcDetails.Location
							detail.FoodCourtIsOpen = fcDetails.IsOpen
							detail.FoodCourtTimings = fcDetails.Timings

							response.ItemFoodCourtDetails = append(response.ItemFoodCourtDetails, detail)

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

	response.Summary.TotalLocations = len(response.FoodCourts)

	utils.RespondSuccess(c, http.StatusOK, "Vendor profile retrieved successfully", response)
}

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

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

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

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

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

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

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

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

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

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

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
	}

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

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

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	var item struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.items.FindOne(ctx, bson.M{"_id": itemData.ItemID, "vendor_id": vendor.ID}).Decode(&item)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Item not found or access denied")
		return
	}

	var foodCourt struct {
		VendorIDs []primitive.ObjectID `bson:"vendor_ids"`
	}
	err = collections.foodCourts.FindOne(ctx, bson.M{"_id": itemData.FoodCourtID}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found")
		return
	}

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

	existing, err := collections.foodCourtItems.CountDocuments(ctx, bson.M{
		"item_id":      itemData.ItemID,
		"foodcourt_id": itemData.FoodCourtID,
	})
	if err == nil && existing > 0 {
		utils.RespondError(c, http.StatusConflict, "Item already exists in this food court")
		return
	}

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

	var createdItemFoodCourt models.ItemFoodCourt
	err = collections.foodCourtItems.FindOne(ctx, bson.M{"_id": result.InsertedID}).Decode(&createdItemFoodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch created item")
		return
	}

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

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

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

	var updatedItem models.ItemFoodCourt
	err = collections.foodCourtItems.FindOne(ctx, bson.M{"_id": foodCourtItemObjID}).Decode(&updatedItem)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch updated item")
		return
	}

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

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

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

	var itemToDelete models.ItemFoodCourt
	err = collections.foodCourtItems.FindOne(ctx, bson.M{
		"item_id":      itemObjID,
		"foodcourt_id": foodCourtObjID,
	}).Decode(&itemToDelete)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court item association not found")
		return
	}

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

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

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

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	var item struct {
		ID   primitive.ObjectID `bson:"_id"`
		Name string             `bson:"name"`
	}
	err = collections.items.FindOne(ctx, bson.M{"_id": itemObjID, "vendor_id": vendor.ID}).Decode(&item)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Item not found or access denied")
		return
	}

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
	}

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

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

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	var user struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.users.FindOne(ctx, bson.M{"_id": managerData.UserID}).Decode(&user)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	var foodCourt struct {
		VendorIDs []primitive.ObjectID `bson:"vendor_ids"`
	}
	err = collections.foodCourts.FindOne(ctx, bson.M{"_id": managerData.FoodCourtID}).Decode(&foodCourt)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Food court not found")
		return
	}

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

	existing, err := collections.managers.CountDocuments(ctx, bson.M{
		"user_id":   managerData.UserID,
		"vendor_id": vendor.ID,
	})
	if err == nil && existing > 0 {
		utils.RespondError(c, http.StatusConflict, "Manager already exists for this vendor")
		return
	}

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
		ContactNo   *string             `json:"contactNo,omitempty"`
		IsActive    *bool               `json:"isActive,omitempty"`
		FoodCourtID *primitive.ObjectID `json:"foodCourtId,omitempty"`
	}

	if err := c.BindJSON(&updateData); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = db.Collection("vendors").FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	updateFields := bson.M{"updatedAt": time.Now()}

	if updateData.ContactNo != nil {
		updateFields["contact_no"] = *updateData.ContactNo
	}
	if updateData.IsActive != nil {
		updateFields["isActive"] = *updateData.IsActive
	}

	if updateData.FoodCourtID != nil {
		var foodCourt struct {
			VendorIDs []primitive.ObjectID `bson:"vendor_ids"`
		}
		err = db.Collection("foodcourts").FindOne(ctx, bson.M{"_id": *updateData.FoodCourtID}).Decode(&foodCourt)
		if err != nil {
			utils.RespondError(c, http.StatusNotFound, "Target food court not found")
			return
		}

		isAuthorized := false
		for _, vID := range foodCourt.VendorIDs {
			if vID == vendor.ID {
				isAuthorized = true
				break
			}
		}

		if !isAuthorized {
			utils.RespondError(c, http.StatusForbidden, "You are not authorized to assign managers to this food court")
			return
		}

		updateFields["foodcourt_id"] = *updateData.FoodCourtID
	}

	result, err := db.Collection("managers").UpdateOne(
		ctx,
		bson.M{"_id": managerObjID, "vendor_id": vendor.ID},
		bson.M{"$set": updateFields},
	)

	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Database error during update")
		return
	}

	if result.MatchedCount == 0 {
		utils.RespondError(c, http.StatusNotFound, "Manager record not found or access denied")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Manager assignment updated successfully", nil)
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

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

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

	var manager struct {
		UserID primitive.ObjectID `bson:"user_id"`
	}
	err = collections.managers.FindOne(ctx, bson.M{"_id": managerObjID}).Decode(&manager)
	if err == nil {

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
	userID, _ := c.Get("userID")
	userObjID, _ := primitive.ObjectIDFromHex(userID.(string))

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	searchEmail := c.Query("email")

	filter := bson.M{
		"_id":  bson.M{"$ne": userObjID},
		"role": bson.M{"$nin": []string{"admin", "vendor"}},
	}

	if searchEmail != "" {
		filter["email"] = bson.M{
			"$regex": primitive.Regex{Pattern: searchEmail, Options: "i"},
		}
	}

	findOptions := options.Find().
		SetLimit(100).
		SetProjection(bson.M{"password": 0}).
		SetSort(bson.M{"name": 1})

	cursor, err := db.Collection("users").Find(ctx, filter, findOptions)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch users")
		return
	}
	defer cursor.Close(ctx)

	var users []struct {
		ID        primitive.ObjectID `bson:"_id" json:"id"`
		Name      string             `bson:"name" json:"name"`
		Email     string             `bson:"email" json:"email"`
		CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	}

	if err := cursor.All(ctx, &users); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Error decoding users")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Users fetched successfully", gin.H{
		"users": users,
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

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var vendor struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err = db.Collection("vendors").FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}

	pipeline := []bson.M{

		{"$match": bson.M{"_id": managerObjID, "vendor_id": vendor.ID}},

		{"$lookup": bson.M{
			"from":         "users",
			"localField":   "user_id",
			"foreignField": "_id",
			"as":           "user_info",
		}},
		{"$unwind": "$user_info"},

		{"$lookup": bson.M{
			"from": "managers",
			"let":  bson.M{"m_user_id": "$user_id"},
			"pipeline": []bson.M{
				{"$match": bson.M{"$expr": bson.M{"$eq": []string{"$user_id", "$$m_user_id"}}}},
				{"$lookup": bson.M{
					"from":         "foodcourts",
					"localField":   "foodcourt_id",
					"foreignField": "_id",
					"as":           "details",
				}},
				{"$unwind": "$details"},
				{"$replaceRoot": bson.M{"newRoot": "$details"}},
			},
			"as": "assigned_food_courts",
		}},

		{"$project": bson.M{
			"id":         "$_id",
			"user_id":    1,
			"userName":   "$user_info.name",
			"userEmail":  "$user_info.email",
			"contact_no": 1,
			"isActive":   1,
			"foodCourts": "$assigned_food_courts",

			"createdAt": 1,
			"updatedAt": 1,
		}},
	}

	cursor, err := db.Collection("managers").Aggregate(ctx, pipeline)
	if err != nil {
		utils.RespondError(c, 500, "Failed to fetch manager data")
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		utils.RespondError(c, 500, "Error processing results")
		return
	}

	if len(results) == 0 {
		utils.RespondError(c, 404, "Manager not found")
		return
	}

	utils.RespondSuccess(c, 200, "Manager details with food courts fetched", results[0])
}

func GetVendorDashboardStats(c *gin.Context, db *mongo.Database) {

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
		items          *mongo.Collection
		foodCourts     *mongo.Collection
		foodCourtItems *mongo.Collection
		managers       *mongo.Collection
	}{
		vendors:        db.Collection("vendors"),
		items:          db.Collection("items"),
		foodCourts:     db.Collection("foodcourts"),
		foodCourtItems: db.Collection("itemfoodcourts"),
		managers:       db.Collection("managers"),
	}

	var vendor struct {
		ID       primitive.ObjectID `bson:"_id"`
		ShopName string             `bson:"shopName"`
	}
	err = collections.vendors.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor not found")
		return
	}
	vendorObjID := vendor.ID

	totalItems, err := collections.items.CountDocuments(ctx, bson.M{"vendor_id": vendorObjID})
	if err != nil {
		totalItems = 0
	}

	totalManagers, err := collections.managers.CountDocuments(ctx, bson.M{"vendor_id": vendorObjID})
	if err != nil {
		totalManagers = 0
	}

	var foodCourtIDs []primitive.ObjectID
	var foodCourtMap = make(map[primitive.ObjectID]string)

	foodCourtsCursor, err := collections.foodCourts.Find(ctx, bson.M{"vendor_ids": vendorObjID})
	if err == nil {
		defer foodCourtsCursor.Close(ctx)
		for foodCourtsCursor.Next(ctx) {
			var foodCourt struct {
				ID   primitive.ObjectID `bson:"_id"`
				Name string             `bson:"name"`
			}
			if err := foodCourtsCursor.Decode(&foodCourt); err == nil {
				foodCourtIDs = append(foodCourtIDs, foodCourt.ID)
				foodCourtMap[foodCourt.ID] = foodCourt.Name
			}
		}
	}
	totalFoodCourts := len(foodCourtIDs)

	var itemIDs []primitive.ObjectID
	itemsCursor, err := collections.items.Find(ctx, bson.M{"vendor_id": vendorObjID})
	if err == nil {
		defer itemsCursor.Close(ctx)
		for itemsCursor.Next(ctx) {
			var item struct {
				ID primitive.ObjectID `bson:"_id"`
			}
			if err := itemsCursor.Decode(&item); err == nil {
				itemIDs = append(itemIDs, item.ID)
			}
		}
	}

	totalFoodCourtItems := int64(0)
	activeItems := int64(0)
	availableItems := int64(0)

	if len(itemIDs) > 0 && len(foodCourtIDs) > 0 {

		totalFoodCourtItems, _ = collections.foodCourtItems.CountDocuments(ctx, bson.M{
			"item_id":      bson.M{"$in": itemIDs},
			"foodcourt_id": bson.M{"$in": foodCourtIDs},
		})

		activeItems, _ = collections.foodCourtItems.CountDocuments(ctx, bson.M{
			"item_id":      bson.M{"$in": itemIDs},
			"foodcourt_id": bson.M{"$in": foodCourtIDs},
			"isActive":     true,
		})

		availableItems, _ = collections.foodCourtItems.CountDocuments(ctx, bson.M{
			"item_id":      bson.M{"$in": itemIDs},
			"foodcourt_id": bson.M{"$in": foodCourtIDs},
			"status":       "available",
		})
	}

	response := struct {
		VendorName string `json:"vendorName"`
		TotalStats struct {
			TotalItems          int64 `json:"totalItems"`
			TotalManagers       int64 `json:"totalManagers"`
			TotalFoodCourts     int   `json:"totalFoodCourts"`
			TotalFoodCourtItems int64 `json:"totalFoodCourtItems"`
			ActiveItems         int64 `json:"activeItems"`
			AvailableItems      int64 `json:"availableItems"`
		} `json:"totalStats"`
		FoodCourts []struct {
			ID        string `json:"id"`
			Name      string `json:"name"`
			ItemCount int64  `json:"itemCount"`
		} `json:"foodCourts,omitempty"`
		RecentUpdates []struct {
			ItemName      string `json:"itemName"`
			FoodCourtName string `json:"foodCourtName"`
			Status        string `json:"status"`
			UpdatedAt     string `json:"updatedAt"`
		} `json:"recentUpdates,omitempty"`
	}{
		VendorName: vendor.ShopName,
	}

	response.TotalStats.TotalItems = totalItems
	response.TotalStats.TotalManagers = totalManagers
	response.TotalStats.TotalFoodCourts = totalFoodCourts
	response.TotalStats.TotalFoodCourtItems = totalFoodCourtItems
	response.TotalStats.ActiveItems = activeItems
	response.TotalStats.AvailableItems = availableItems

	for foodCourtID, foodCourtName := range foodCourtMap {
		itemCount, _ := collections.foodCourtItems.CountDocuments(ctx, bson.M{
			"foodcourt_id": foodCourtID,
			"item_id":      bson.M{"$in": itemIDs},
		})

		response.FoodCourts = append(response.FoodCourts, struct {
			ID        string `json:"id"`
			Name      string `json:"name"`
			ItemCount int64  `json:"itemCount"`
		}{
			ID:        foodCourtID.Hex(),
			Name:      foodCourtName,
			ItemCount: itemCount,
		})
	}

	if len(itemIDs) > 0 && len(foodCourtIDs) > 0 {
		cursor, err := collections.foodCourtItems.Find(ctx, bson.M{
			"item_id":      bson.M{"$in": itemIDs},
			"foodcourt_id": bson.M{"$in": foodCourtIDs},
		}, options.Find().SetSort(bson.M{"updatedAt": -1}).SetLimit(5))

		if err == nil {
			defer cursor.Close(ctx)
			for cursor.Next(ctx) {
				var fci struct {
					ItemID      primitive.ObjectID `bson:"item_id"`
					FoodCourtID primitive.ObjectID `bson:"foodcourt_id"`
					Status      string             `bson:"status"`
					UpdatedAt   primitive.DateTime `bson:"updatedAt"`
				}
				if err := cursor.Decode(&fci); err == nil {

					var item struct {
						Name string `bson:"name"`
					}
					collections.items.FindOne(ctx, bson.M{"_id": fci.ItemID}).Decode(&item)

					foodCourtName := foodCourtMap[fci.FoodCourtID]

					response.RecentUpdates = append(response.RecentUpdates, struct {
						ItemName      string `json:"itemName"`
						FoodCourtName string `json:"foodCourtName"`
						Status        string `json:"status"`
						UpdatedAt     string `json:"updatedAt"`
					}{
						ItemName:      item.Name,
						FoodCourtName: foodCourtName,
						Status:        fci.Status,
						UpdatedAt:     fci.UpdatedAt.Time().Format(time.RFC3339),
					})
				}
			}
		}
	}

	utils.RespondSuccess(c, http.StatusOK, "Dashboard stats retrieved successfully", response)
}

func SingleFoodCourtItems(c *gin.Context, db *mongo.Database) {
	foodCourtID := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "User authentication required")
		return
	}

	foodCourtObjID, err := primitive.ObjectIDFromHex(foodCourtID)
	userObjID, err2 := primitive.ObjectIDFromHex(userID.(string))
	if err != nil || err2 != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid ID format")
		return
	}

	ctx := context.TODO()

	var vendor models.Vendor
	err = db.Collection("vendors").FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor profile not found")
		return
	}

	pipeline := []bson.M{

		{"$match": bson.M{"foodcourt_id": foodCourtObjID}},

		{"$lookup": bson.M{
			"from":         "items",
			"localField":   "item_id",
			"foreignField": "_id",
			"as":           "item_details",
		}},
		{"$unwind": "$item_details"},

		{"$match": bson.M{"item_details.vendor_id": vendor.ID}},

		{"$project": bson.M{
			"id":          "$_id",
			"item_id":     "$item_id",
			"name":        "$item_details.name",
			"category":    "$item_details.category",
			"description": "$item_details.description",
			"basePrice":   "$item_details.basePrice",
			"price":       "$price",

			"status":   "$status",
			"isActive": "$isActive",
			"timeSlot": "$timeSlot",
			"isVeg":    "$item_details.isVeg",
		}},
	}

	cursor, err := db.Collection("itemfoodcourts").Aggregate(ctx, pipeline)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Aggregation failed")
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M = []bson.M{}

	if err := cursor.All(ctx, &results); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Decoding failed")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Items retrieved", results)
}

func GetVendorFoodCourtsForDisplay(c *gin.Context, db *mongo.Database) {
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID.(string))
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var vendor models.Vendor
	err := db.Collection("vendors").FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&vendor)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Vendor profile not found")
		return
	}

	pipeline := []bson.M{
		{"$match": bson.M{"vendor_ids": vendor.ID}},

		{"$lookup": bson.M{
			"from":         "itemfoodcourts",
			"localField":   "_id",
			"foreignField": "foodcourt_id",
			"as":           "all_fc_items",
		}},

		{"$lookup": bson.M{
			"from":         "items",
			"localField":   "all_fc_items.item_id",
			"foreignField": "_id",
			"as":           "master_items",
		}},

		{"$project": bson.M{
			"id":       "$_id",
			"name":     1,
			"location": 1,
			"isOpen":   1,
			"timings":  1,

			"vendorItems": bson.M{
				"$filter": bson.M{
					"input": "$all_fc_items",
					"as":    "fcItem",
					"cond": bson.M{"$in": []interface{}{
						"$$fcItem.item_id",
						bson.M{
							"$map": bson.M{
								"input": bson.M{
									"$filter": bson.M{
										"input": "$master_items",
										"as":    "mItem",
										"cond":  bson.M{"$eq": []interface{}{"$$mItem.vendor_id", vendor.ID}},
									},
								},
								"as": "filtered",
								"in": "$$filtered._id",
							},
						},
					}},
				},
			},
		}},

		{"$project": bson.M{
			"id":         1,
			"name":       1,
			"location":   1,
			"isOpen":     1,
			"timings":    1,
			"totalItems": bson.M{"$size": "$vendorItems"},
			"activeItems": bson.M{
				"$size": bson.M{
					"$filter": bson.M{
						"input": "$vendorItems",
						"as":    "vi",
						"cond":  bson.M{"$eq": []interface{}{"$$vi.isActive", true}},
					},
				},
			},
		}},
		{"$sort": bson.M{"name": 1}},
	}

	cursor, err := db.Collection("foodcourts").Aggregate(ctx, pipeline)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to aggregate food court data")
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M = []bson.M{}
	if err := cursor.All(ctx, &results); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to decode results")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Vendor food courts retrieved successfully", results)
}
