package utils

import (
	"os"
	"testing"

	"github.com/golang-jwt/jwt/v5"
)

func TestJWTGenerationAndValidation(t *testing.T) {
	// Set test secrets
	os.Setenv("ACCESS_SECRET", "test-access-secret-key-1234567890")
	os.Setenv("REFRESH_SECRET", "test-refresh-secret-key-1234567890")

	userID := "60d5ec49f1b2c8b1f8e4e1a1"
	role := "vendor"

	// 1. Generate access token
	tokenStr, err := GenerateAccessToken(userID, role)
	if err != nil {
		t.Fatalf("Failed to generate access token: %v", err)
	}
	if tokenStr == "" {
		t.Fatal("Generated token is empty")
	}

	// 2. Validate token with correct secret
	claims, err := ValidateToken(tokenStr, false)
	if err != nil {
		t.Fatalf("Validation failed for valid token: %v", err)
	}
	if claims.UserID != userID {
		t.Errorf("Expected UserID %s, got %s", userID, claims.UserID)
	}
	if claims.Role != role {
		t.Errorf("Expected Role %s, got %s", role, claims.Role)
	}

	// 3. Ensure token signed with empty secret is rejected
	claimsEmpty := JWTClaims{
		UserID: userID,
		Role:   role,
	}
	emptySignedToken, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, claimsEmpty).SignedString([]byte(""))
	_, err = ValidateToken(emptySignedToken, false)
	if err == nil {
		t.Fatal("Security flaw: token signed with empty secret was accepted!")
	}

	// 4. Test refresh token generation and validation
	refreshTokenStr, err := GenerateRefreshToken(userID, role)
	if err != nil {
		t.Fatalf("Failed to generate refresh token: %v", err)
	}
	refreshClaims, err := ValidateRefreshToken(refreshTokenStr)
	if err != nil {
		t.Fatalf("Validation failed for refresh token: %v", err)
	}
	if refreshClaims.UserID != userID || refreshClaims.Role != role {
		t.Errorf("Refresh token claims mismatch: got %v", refreshClaims)
	}

	// 5. Test Algorithm Verification (SEC-04): ensure alg 'none' token is rejected
	noneToken := jwt.NewWithClaims(jwt.SigningMethodNone, claimsEmpty)
	noneTokenString, _ := noneToken.SignedString(jwt.UnsafeAllowNoneSignatureType)
	_, err = ValidateToken(noneTokenString, false)
	if err == nil {
		t.Fatal("Security flaw: token with alg 'none' was accepted!")
	}
}

