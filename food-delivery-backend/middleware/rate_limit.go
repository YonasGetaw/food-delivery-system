package middleware

import (
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
    "food-delivery-backend/pkg"
    "food-delivery-backend/redis"
)

func RateLimitMiddleware(redisClient *redis.RedisClient, limit int, window time.Duration) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Get user ID if authenticated
        userID, exists := c.Get("user_id")
        if !exists {
            // For unauthenticated requests, use IP address
            userID = c.ClientIP()
        }

        var id uint
        switch v := userID.(type) {
        case uint:
            id = v
        case string:
            // For IP addresses, we'll use a different approach
            count, err := redisClient.IncrementRequestCount(c.Request.Context(), 0, window)
            if err != nil {
                c.Next()
                return
            }
            if count > int64(limit) {
                pkg.SendError(c, http.StatusTooManyRequests, "Rate limit exceeded. Please try again later.", nil)
                c.Abort()
                return
            }
            c.Next()
            return
        }

        // For authenticated users
        count, err := redisClient.IncrementRequestCount(c.Request.Context(), id, window)
        if err != nil {
            c.Next()
            return
        }

        if count > int64(limit) {
            pkg.SendError(c, http.StatusTooManyRequests, "Rate limit exceeded. Please try again later.", nil)
            c.Abort()
            return
        }

        c.Next()
    }
}