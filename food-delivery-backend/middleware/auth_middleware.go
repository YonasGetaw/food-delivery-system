package middleware

import (
    "net/http"
    "strings"
    "github.com/gin-gonic/gin"
    "food-delivery-backend/pkg"
)

func AuthMiddleware(jwtMaker *pkg.JWTMaker) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        token := ""

        if authHeader != "" {
            parts := strings.Split(authHeader, " ")
            if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
                pkg.SendError(c, http.StatusUnauthorized, "Invalid authorization header format", nil)
                c.Abort()
                return
            }
            token = parts[1]
        } else {
            token = c.Query("token")
            if token == "" {
                pkg.SendError(c, http.StatusUnauthorized, "Authorization header required", nil)
                c.Abort()
                return
            }
        }

        claims, err := jwtMaker.ValidateToken(token)
        if err != nil {
            pkg.SendError(c, http.StatusUnauthorized, "Invalid or expired token", err.Error())
            c.Abort()
            return
        }

        // Set user info in context
        c.Set("user_id", claims.UserID)
        c.Set("user_email", claims.Email)
        c.Set("user_role", claims.Role)

        c.Next()
    }
}

func OptionalAuthMiddleware(jwtMaker *pkg.JWTMaker) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.Next()
            return
        }

        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
            c.Next()
            return
        }

        claims, err := jwtMaker.ValidateToken(parts[1])
        if err == nil {
            c.Set("user_id", claims.UserID)
            c.Set("user_email", claims.Email)
            c.Set("user_role", claims.Role)
        }

        c.Next()
    }
}