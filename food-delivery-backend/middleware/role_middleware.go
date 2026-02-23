package middleware

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "food-delivery-backend/pkg"
)

func RequireRole(allowedRoles ...string) gin.HandlerFunc {
    return func(c *gin.Context) {
        userRole, exists := c.Get("user_role")
        if !exists {
            pkg.SendError(c, http.StatusForbidden, "Access denied: role not found", nil)
            c.Abort()
            return
        }

        roleStr := userRole.(string)
        for _, allowed := range allowedRoles {
            if roleStr == allowed {
                c.Next()
                return
            }
        }

        pkg.SendError(c, http.StatusForbidden, "Insufficient permissions for this action", nil)
        c.Abort()
    }
}

func RequireOwnershipOrAdmin(getResourceOwnerID func(*gin.Context) uint) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetUint("user_id")
        userRole := c.GetString("user_role")

        if userRole == "admin" {
            c.Next()
            return
        }

        resourceOwnerID := getResourceOwnerID(c)
        if resourceOwnerID == 0 {
            pkg.SendError(c, http.StatusBadRequest, "Could not determine resource owner", nil)
            c.Abort()
            return
        }

        if userID != resourceOwnerID {
            pkg.SendError(c, http.StatusForbidden, "You don't have permission to access this resource", nil)
            c.Abort()
            return
        }

        c.Next()
    }
}