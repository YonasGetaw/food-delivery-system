package pkg

import (
    "errors"
    "time"
    "github.com/golang-jwt/jwt/v5"
)

type Claims struct {
    UserID uint   `json:"user_id"`
    Email  string `json:"email"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

type JWTMaker struct {
    secret string
}

func NewJWTMaker(secret string) *JWTMaker {
    return &JWTMaker{secret: secret}
}

func (m *JWTMaker) GenerateToken(userID uint, email, role string, duration time.Duration) (string, error) {
    claims := &Claims{
        UserID: userID,
        Email:  email,
        Role:   role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            NotBefore: jwt.NewNumericDate(time.Now()),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(m.secret))
}

func (m *JWTMaker) ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("unexpected signing method")
        }
        return []byte(m.secret), nil
    })

    if err != nil {
        return nil, err
    }

    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }

    return nil, errors.New("invalid token")
}

func (m *JWTMaker) RefreshToken(tokenString string, duration time.Duration) (string, error) {
    claims, err := m.ValidateToken(tokenString)
    if err != nil {
        return "", err
    }

    // Generate new token with extended expiry
    return m.GenerateToken(claims.UserID, claims.Email, claims.Role, duration)
}