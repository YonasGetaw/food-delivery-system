package notifications

import (
	"net/http"
	"strconv"
	"time"

	"food-delivery-backend/database"
	"food-delivery-backend/pkg"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type Handler struct {
	db     *gorm.DB
	logger *zap.Logger
}

func NewHandler(db *gorm.DB, logger *zap.Logger) *Handler {
	return &Handler{db: db, logger: logger}
}

// ListMyNotifications returns the latest notifications for the authenticated user.
func (h *Handler) ListMyNotifications(c *gin.Context) {
	userID := c.GetUint("user_id")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	var items []database.Notification
	if err := h.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&items).Error; err != nil {
		h.logger.Error("Failed to list notifications", zap.Error(err))
		pkg.SendError(c, http.StatusInternalServerError, "Failed to load notifications", nil)
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Notifications retrieved", items)
}

// GetMyUnreadCount returns the number of unread notifications for the authenticated user.
func (h *Handler) GetMyUnreadCount(c *gin.Context) {
	userID := c.GetUint("user_id")

	var count int64
	if err := h.db.Model(&database.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error; err != nil {
		h.logger.Error("Failed to count unread notifications", zap.Error(err))
		pkg.SendError(c, http.StatusInternalServerError, "Failed to load notifications", nil)
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Unread count retrieved", gin.H{"count": count})
}

// MarkNotificationRead marks a notification as read for the authenticated user.
func (h *Handler) MarkNotificationRead(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid notification id", nil)
		return
	}

	now := time.Now()
	res := h.db.Model(&database.Notification{}).
		Where("id = ? AND user_id = ?", uint(id), userID).
		Updates(map[string]interface{}{"is_read": true, "read_at": &now})
	if res.Error != nil {
		h.logger.Error("Failed to mark notification read", zap.Error(res.Error))
		pkg.SendError(c, http.StatusInternalServerError, "Failed to update notification", nil)
		return
	}
	if res.RowsAffected == 0 {
		pkg.SendError(c, http.StatusNotFound, "Notification not found", nil)
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Notification updated", nil)
}

// MarkAllNotificationsRead marks all notifications as read for the authenticated user.
func (h *Handler) MarkAllNotificationsRead(c *gin.Context) {
	userID := c.GetUint("user_id")
	now := time.Now()

	if err := h.db.Model(&database.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Updates(map[string]interface{}{"is_read": true, "read_at": &now}).Error; err != nil {
		h.logger.Error("Failed to mark all notifications read", zap.Error(err))
		pkg.SendError(c, http.StatusInternalServerError, "Failed to update notifications", nil)
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Notifications updated", nil)
}
