package vendors

import (
    "fmt"
    "net/http"
    "os"
    "path/filepath"
    "time"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
    "food-delivery-backend/pkg"
)

func (h *Handler) UploadImage(c *gin.Context) {
    file, err := c.FormFile("image")
    if err != nil {
        pkg.SendError(c, http.StatusBadRequest, "No image file provided", err.Error())
        return
    }

    // Validate file size (5MB max)
    if file.Size > 5*1024*1024 {
        pkg.SendError(c, http.StatusBadRequest, "File too large", "Maximum size is 5MB")
        return
    }

    // Validate file type
    ext := filepath.Ext(file.Filename)
    allowedExts := []string{".jpg", ".jpeg", ".png", ".gif"}
    valid := false
    for _, allowedExt := range allowedExts {
        if ext == allowedExt {
            valid = true
            break
        }
    }
    if !valid {
        pkg.SendError(c, http.StatusBadRequest, "Invalid file type", "Only JPG, PNG, GIF allowed")
        return
    }

    // Create uploads directory if it doesn't exist
    uploadDir := "./uploads"
    if err := os.MkdirAll(uploadDir, 0755); err != nil {
        h.logger.Error("Failed to create upload directory", zap.Error(err))
        pkg.SendError(c, http.StatusInternalServerError, "Failed to save file", nil)
        return
    }

    // Generate unique filename
    filename := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
    filepath := filepath.Join(uploadDir, filename)

    // Save file
    if err := c.SaveUploadedFile(file, filepath); err != nil {
        h.logger.Error("Failed to save file", zap.Error(err))
        pkg.SendError(c, http.StatusInternalServerError, "Failed to save file", nil)
        return
    }

    // Return URL (adjust based on your server setup)
    imageURL := fmt.Sprintf("/uploads/%s", filename)
    
    pkg.SendSuccess(c, http.StatusOK, "Image uploaded successfully", gin.H{
        "image_url": imageURL,
    })
}