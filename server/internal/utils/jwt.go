package utils

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func getAccessSecret() []byte {
	secret := os.Getenv("ACCESS_SECRET")
	if secret == "" {
		log.Println("⚠️  WARNING: ACCESS_SECRET is not set in environment or .env file")
	}
	return []byte(secret)
}

func getRefreshSecret() []byte {
	secret := os.Getenv("REFRESH_SECRET")
	if secret == "" {
		log.Println("⚠️  WARNING: REFRESH_SECRET is not set in environment or .env file")
	}
	return []byte(secret)
}

type JWTClaims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateAccessToken(userID, role string) (string, error) {
	claims := JWTClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getAccessSecret())
}

func GenerateRefreshToken(userID, role string) (string, error) {
	claims := JWTClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getRefreshSecret())
}

func ValidateToken(tokenStr string, isRefresh bool) (*JWTClaims, error) {
	var secret []byte
	if isRefresh {
		secret = getRefreshSecret()
	} else {
		secret = getAccessSecret()
	}

	token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, err
	}

	return claims, nil
}

func ValidateRefreshToken(tokenStr string) (*JWTClaims, error) {
	secret := getRefreshSecret()
	token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, err
	}

	return claims, nil
}
