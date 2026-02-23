package middleware

import (
    "time"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
)

func LoggerMiddleware(logger *zap.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path
        method := c.Request.Method
        clientIP := c.ClientIP()

        c.Next()

        latency := time.Since(start)
        statusCode := c.Writer.Status()
        errorMessage := c.Errors.ByType(gin.ErrorTypePrivate).String()

        logger.Info("HTTP Request",
            zap.Int("status", statusCode),
            zap.String("method", method),
            zap.String("path", path),
            zap.Duration("latency", latency),
            zap.String("ip", clientIP),
            zap.String("error", errorMessage),
        )
    }
}