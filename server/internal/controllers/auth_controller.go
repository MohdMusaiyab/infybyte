package controllers

import (
	"context"
	"net/http"
	"time"

	"github.com/MohdMusaiyab/infybyte/server/internal/models"
	"github.com/MohdMusaiyab/infybyte/server/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Register handles user registration
func Register(c *gin.Context, db *mongo.Database) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		utils.RespondError(c, 400, "Invalid request body")
		return
	}
	user.Role = "user"
	if err := utils.Validate.Struct(user); err != nil {
		validationErrors := err.(validator.ValidationErrors)
		for _, fieldErr := range validationErrors {
			// Build key in format Field.Tag
			key := fieldErr.StructField() + "." + fieldErr.Tag()

			// Look up friendly message in the model
			if msg, ok := models.UserValidationMessages[key]; ok {
				utils.RespondError(c, 400, msg)
				return
			}
		}
	}

	// Check if email already exists
	collection := db.Collection("users")
	count, err := collection.CountDocuments(context.TODO(), bson.M{"email": user.Email})
	if err != nil {
		utils.RespondError(c, 500, "Database error")
		return
	}
	if count > 0 {
		utils.RespondError(c, 409, "Email already registered")
		return
	}

	// Hash password
	hashed, err := utils.HashPassword(user.Password)
	if err != nil {
		utils.RespondError(c, 500, "Failed to hash password")
		return
	}
	user.Password = hashed
	user.ID = primitive.NewObjectID()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	// Insert into DB
	res, err := collection.InsertOne(context.TODO(), user)
	if err != nil {
		utils.RespondError(c, 500, "Failed to create user")
		return
	}

	utils.RespondSuccess(c, 201, "User registered successfully", gin.H{
		"id":    res.InsertedID,
		"name":  user.Name,
		"email": user.Email,
		"role":  user.Role,
	})
}

// Login handles user login
// func Login(c *gin.Context, db *mongo.Database) {
// 	var creds struct {
// 		Email    string `json:"email" binding:"required,email"`
// 		Password string `json:"password" binding:"required,min=6"`
// 	}

// 	if err := c.ShouldBindJSON(&creds); err != nil {
// 		utils.RespondError(c, 400, "Invalid input")
// 		return
// 	}

// 	// Find user by email
// 	collection := db.Collection("users")
// 	var user models.User
// 	if err := collection.FindOne(context.TODO(), bson.M{"email": creds.Email}).Decode(&user); err != nil {
// 		utils.RespondError(c, 401, "Invalid email or password")
// 		return
// 	}
// 	fmt.Println("User Found")
// 	// Check password
// 	if !utils.CheckPassword(user.Password, creds.Password) {
// 		utils.RespondError(c, 401, "Invalid email or password")
// 		return
// 	}

// 	// Generate tokens
// 	access, err := utils.GenerateAccessToken(user.ID.Hex(), user.Role)
// 	if err != nil {
// 		utils.RespondError(c, 500, "Failed to generate access token")
// 		return
// 	}
// 	refresh, err := utils.GenerateRefreshToken(user.ID.Hex(), user.Role)
// 	if err != nil {
// 		utils.RespondError(c, 500, "Failed to generate refresh token")
// 		return
// 	}

//		utils.RespondSuccess(c, 200, "Login successful", gin.H{
//			"access_token":  access,
//			"refresh_token": refresh,
//			"user": gin.H{
//				"id":    user.ID.Hex(),
//				"name":  user.Name,
//				"email": user.Email,
//				"role":  user.Role,
//			},
//		})
//	}
func Login(c *gin.Context, db *mongo.Database) {
	var creds struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&creds); err != nil {
		utils.RespondError(c, 400, "Invalid input")
		return
	}

	collection := db.Collection("users")
	var user models.User
	if err := collection.FindOne(context.TODO(), bson.M{"email": creds.Email}).Decode(&user); err != nil {
		utils.RespondError(c, 401, "Invalid email or password")
		return
	}

	if !utils.CheckPassword(user.Password, creds.Password) {
		utils.RespondError(c, 401, "Invalid email or password")
		return
	}

	accessToken, err := utils.GenerateAccessToken(user.ID.Hex(), user.Role)
	if err != nil {
		utils.RespondError(c, 500, "Failed to generate access token")
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID.Hex(), user.Role)
	if err != nil {
		utils.RespondError(c, 500, "Failed to generate refresh token")
		return
	}

	c.SetCookie(
		"refresh_token",
		refreshToken,
		60*60*24*7, // 7 days
		"/",
		"", // domain (empty = current)
		true,
		true,
	)
	// Optionally: SameSite=None/Lax/Strict depending on your setup
	// For Gin, use the cookie header directly if you need SameSite attribute:
	// c.Header("Set-Cookie", fmt.Sprintf("refresh_token=%s; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=%d", refreshToken, 60*60*24*7))

	utils.RespondSuccess(c, 200, "Login successful", gin.H{
		"access_token": accessToken,
		"user": gin.H{
			"id":    user.ID.Hex(),
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

func Refresh(c *gin.Context, db *mongo.Database) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Refresh token missing")
		return
	}

	claims, err := utils.ValidateToken(refreshToken, true)
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid or expired refresh token")
		return
	}

	accessToken, err := utils.GenerateAccessToken(claims.UserID, claims.Role)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate access token")
		return
	}

	newRefreshToken, err := utils.GenerateRefreshToken(claims.UserID, claims.Role)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate refresh token")
		return
	}

	c.SetCookie(
		"refresh_token",
		newRefreshToken,
		int((7 * 24 * time.Hour).Seconds()), // 7 days
		"/",
		"",
		true,
		true,
	)

	utils.RespondSuccess(c, http.StatusOK, "Token refreshed successfully", gin.H{
		"access_token": accessToken,
	})
}

func Logout(c *gin.Context, db *mongo.Database) {
	c.SetCookie(
		"refresh_token",
		"",
		-1, 
		"/",
		"",
		true,
		true,
	)
	utils.RespondSuccess(c, 200, "Logged out successfully", nil)
}
