package notifications

import (
	"encoding/json"
	"fmt"
	"food-delivery-backend/database"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

type NotificationMessage struct {
	Type      string      `json:"type"`
	Title     string      `json:"title"`
	Message   string      `json:"message"`
	Reference string      `json:"reference,omitempty"`
	Data      interface{} `json:"data,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

type Service struct {
	hub    *Hub
	logger *zap.Logger
	db     *gorm.DB
}

func NewService(hub *Hub, logger *zap.Logger, db *gorm.DB) *Service {
	return &Service{
		hub:    hub,
		logger: logger,
		db:     db,
	}
}

func (s *Service) sendToUser(userID uint, msg *NotificationMessage) {
	jsonMsg, err := json.Marshal(msg)
	if err != nil {
		s.logger.Error("Failed to marshal notification", zap.Error(err))
		return
	}

	s.hub.BroadcastToUser(userID, jsonMsg)

	// Save to database
	notification := &database.Notification{
		UserID:      userID,
		Title:       msg.Title,
		Message:     msg.Message,
		Type:        msg.Type,
		ReferenceID: msg.Reference,
		IsRead:      false,
	}
	s.db.Create(notification)
}

func (s *Service) NotifyStudent(studentID uint, title, message, notificationType, reference string) {
	msg := &NotificationMessage{
		Type:      notificationType,
		Title:     title,
		Message:   message,
		Reference: reference,
		Timestamp: time.Now().Unix(),
	}
	s.sendToUser(studentID, msg)
}

func (s *Service) NotifyVendor(vendorUserID uint, title, message, notificationType, reference string) {
	msg := &NotificationMessage{
		Type:      notificationType,
		Title:     title,
		Message:   message,
		Reference: reference,
		Timestamp: time.Now().Unix(),
	}
	s.sendToUser(vendorUserID, msg)
}

func (s *Service) NotifyRider(riderUserID uint, title, message, notificationType, reference string) {
	msg := &NotificationMessage{
		Type:      notificationType,
		Title:     title,
		Message:   message,
		Reference: reference,
		Timestamp: time.Now().Unix(),
	}
	s.sendToUser(riderUserID, msg)
}

func (s *Service) NotifyAdmin(title, message string) {
	msg := &NotificationMessage{
		Type:      "admin_notification",
		Title:     title,
		Message:   message,
		Timestamp: time.Now().Unix(),
	}

	// Get all admin users
	var admins []database.User
	s.db.Where("role = ?", "admin").Find(&admins)

	for _, admin := range admins {
		s.sendToUser(admin.ID, msg)
	}
}

func (s *Service) NotifyOrderUpdate(order *database.Order, newStatus database.OrderStatus, reason string) {
	// Notify student
	// order.StudentID is Student.ID; send notifications to the underlying user
	if order.Student.ID != 0 {
		s.NotifyStudent(order.Student.UserID, "Order Update",
			"Your order #"+order.OrderNumber+" is now "+string(newStatus),
			"order_update", fmt.Sprintf("%d", order.ID))
	}

	// Notify vendor
	s.NotifyVendor(order.Vendor.UserID, "Order Update",
		"Order #"+order.OrderNumber+" status: "+string(newStatus),
		"order_update", fmt.Sprintf("%d", order.ID))

	// Notify rider if assigned
	if order.AssignedRiderID != nil && order.AssignedRider != nil {
		s.NotifyRider(order.AssignedRider.UserID, "Delivery Update",
			"Delivery #"+order.OrderNumber+" status: "+string(newStatus),
			"order_update", fmt.Sprintf("%d", order.ID))
	}

	// Notify admin for important events
	if newStatus == database.OrderStatusDelivered ||
		newStatus == database.OrderStatusCancelled ||
		newStatus == database.OrderStatusRejected {
		s.NotifyAdmin("Order "+string(newStatus),
			"Order #"+order.OrderNumber+" has been "+string(newStatus))
	}
}

func (s *Service) NotifyNewOrder(order *database.Order) {
	// Notify vendor
	s.NotifyVendor(order.Vendor.UserID, "New Order!",
		"You have received a new order #"+order.OrderNumber,
		"new_order", fmt.Sprintf("%d", order.ID))

	// Notify admin
	s.NotifyAdmin("New Order Created",
		"Order #"+order.OrderNumber+" has been placed")
}

func (s *Service) NotifyRiderAssigned(order *database.Order, riderID uint) {
	if order.AssignedRider == nil {
		return
	}

	// Notify rider
	s.NotifyRider(order.AssignedRider.UserID, "New Delivery",
		"You have been assigned to deliver order #"+order.OrderNumber,
		"rider_assigned", fmt.Sprintf("%d", order.ID))

	// Notify student
	if order.Student.ID != 0 {
		s.NotifyStudent(order.Student.UserID, "Rider Assigned",
			"A rider has been assigned to your order #"+order.OrderNumber,
			"rider_assigned", fmt.Sprintf("%d", order.ID))
	}

	// Notify vendor
	s.NotifyVendor(order.Vendor.UserID, "Rider Assigned",
		"Rider assigned to order #"+order.OrderNumber,
		"rider_assigned", fmt.Sprintf("%d", order.ID))
}
