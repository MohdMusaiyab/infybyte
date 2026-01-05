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

func setRefreshCookie(c *gin.Context, token string, maxAge int) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    token,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   true,                     
		SameSite: http.SameSiteNoneMode,    
	})
}

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
			key := fieldErr.StructField() + "." + fieldErr.Tag()
			if msg, ok := models.UserValidationMessages[key]; ok {
				utils.RespondError(c, 400, msg)
				return
			}
		}
	}

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

	hashed, err := utils.HashPassword(user.Password)
	if err != nil {
		utils.RespondError(c, 500, "Failed to hash password")
		return
	}

	user.Password = hashed
	user.ID = primitive.NewObjectID()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

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
		utils.RespondError(c, 400, "Invalid email or password")
		return
	}

	if !utils.CheckPassword(user.Password, creds.Password) {
		utils.RespondError(c, 400, "Invalid email or password")
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
	setRefreshCookie(c, refreshToken, 7*24*60*60)

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
	var req struct{}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid request body")
		return
	}
	
	cookie, err := c.Cookie("refresh_token")
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Missing refresh token")
		return
	}

	claims, err := utils.ValidateRefreshToken(cookie)
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid or expired refresh token")
		return
	}

	accessToken, err := utils.GenerateAccessToken(claims.UserID, claims.Role)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Could not generate token")
		return
	}

	var user models.User
	oid, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID in token")
		return
	}
	err = db.Collection("users").FindOne(context.TODO(), bson.M{"_id": oid}).Decode(&user)
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "User not found")

		return
	}
	utils.RespondSuccess(c, http.StatusOK, "Token refreshed successfully", gin.H{
		"access_token": accessToken,
		"user": gin.H{
			"id":    user.ID.Hex(),
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

func Logout(c *gin.Context, db *mongo.Database) {

	setRefreshCookie(c, "", -1)
	utils.RespondSuccess(c, 200, "Logged out successfully", nil)
}
