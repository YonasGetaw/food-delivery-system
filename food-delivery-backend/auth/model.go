package auth

import (
    "time"
    "github.com/golang-jwt/jwt/v5"
)

type LoginRequest struct {
    Phone    string `json:"phone" binding:"required"`
    Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
    FirstName string `json:"first_name" binding:"required"`
    LastName  string `json:"last_name"`
    StudentID string `json:"student_id" binding:"required"`
    Phone     string `json:"phone" binding:"required"`
    Password  string `json:"password" binding:"required,min=6"`
}

type ChangePasswordRequest struct {
    OldPassword string `json:"old_password" binding:"required"`
    NewPassword string `json:"new_password" binding:"required,min=6"`
}

type AuthResponse struct {
    Token     string `json:"token"`
    UserID    uint   `json:"user_id"`
    Email     string `json:"email"`
    Phone     string `json:"phone"`
    FirstName string `json:"first_name"`
    LastName  string `json:"last_name"`
    Role      string `json:"role"`
}

type Claims struct {
    UserID uint   `json:"user_id"`
    Email  string `json:"email"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

type TokenDetails struct {
    Token     string
    ExpiresAt time.Time
}