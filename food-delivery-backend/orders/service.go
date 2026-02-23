// Add these imports at the top
package orders

// Add these imports at the top
import (
	"context"
	"errors"
	"fmt"
	"food-delivery-backend/config"
	"food-delivery-backend/database"
	"food-delivery-backend/notifications"
	"food-delivery-backend/pkg"
	"food-delivery-backend/redis"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

// ... rest of the file
// Add this method to orders/service.go

func (s *Service) autoAssignRider(order *database.Order) error {
	// Find nearest available riders
	ctx := context.Background()
	riders, err := s.redisClient.FindNearestRiders(
		ctx,
		order.DeliveryLat,
		order.DeliveryLng,
		10.0, // 10km radius
	)
	if err != nil || len(riders) == 0 {
		s.logger.Warn("No available riders found for auto-assignment", zap.Uint("order_id", order.ID))
		return errors.New("no available riders")
	}

	// Try to assign to first rider
	for _, riderLoc := range riders {
		riderIDStr := riderLoc.Name
		var riderID uint
		fmt.Sscanf(riderIDStr, "%d", &riderID)

		// Check if rider is available
		available, err := s.redisClient.IsRiderAvailable(ctx, riderID)
		if err != nil || !available {
			continue
		}

		// Assign rider
		if err := s.assignRiderToOrder(order.ID, riderID); err != nil {
			s.logger.Warn("Failed to assign rider", zap.Uint("rider_id", riderID), zap.Error(err))
			continue
		}

		s.logger.Info("Auto-assigned rider to order", zap.Uint("order_id", order.ID), zap.Uint("rider_id", riderID))
		return nil
	}

	return errors.New("no available riders could be assigned")
}

func (s *Service) assignRiderToOrder(orderID, riderID uint) error {
	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return err
	}

	// Update order with rider
	updates := map[string]interface{}{
		"assigned_rider_id": riderID,
	}

	if err := s.repo.UpdateOrderStatus(orderID, order.Status, updates); err != nil {
		return err
	}

	// Update rider availability
	s.repo.UpdateRiderAvailability(riderID, false)

	// Reload order with rider info
	order, _ = s.repo.GetOrderByID(orderID)

	// Send notifications
	s.notifier.NotifyRiderAssigned(order, riderID)
	s.notifier.NotifyAdmin("Rider Assigned",
		fmt.Sprintf("Rider #%d was assigned to order #%s", riderID, order.OrderNumber))

	return nil
}

// Update MarkOrderReady to auto-assign rider
func (s *Service) MarkOrderReady(vendorID uint, orderID uint) error {
	vendor, err := s.repo.GetVendorByID(vendorID)
	if err != nil {
		return errors.New("vendor not found")
	}

	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return errors.New("order not found")
	}

	if order.VendorID != vendor.ID {
		return errors.New("unauthorized to update this order")
	}

	if order.Status != database.OrderStatusPreparing {
		return errors.New("order must be in preparing status to mark as ready")
	}

	now := time.Now()
	updates := map[string]interface{}{
		"ready_at": now,
	}
	if err := s.repo.UpdateOrderStatus(orderID, database.OrderStatusReady, updates); err != nil {
		return err
	}

	// Reload order to get updated status
	order, _ = s.repo.GetOrderByID(orderID)

	// Auto-assign rider when order is ready
	if order.AssignedRiderID == nil {
		if err := s.autoAssignRider(order); err != nil {
			s.logger.Warn("Failed to auto-assign rider", zap.Error(err))
			// Notify admin for manual assignment
			s.notifier.NotifyAdmin("Order Ready - Manual Assignment Required",
				fmt.Sprintf("Order #%s is ready but no rider could be auto-assigned", order.OrderNumber))
		}
	}

	return nil
}

type Service struct {
	repo        *Repository
	notifier    *notifications.Service
	redisClient *redis.RedisClient
	db          *gorm.DB
	cfg         *config.Config
	logger      *zap.Logger
}

func NewService(
	repo *Repository,
	notifier *notifications.Service,
	redisClient *redis.RedisClient,
	db *gorm.DB,
	cfg *config.Config,
	logger *zap.Logger,
) *Service {
	return &Service{
		repo:        repo,
		notifier:    notifier,
		redisClient: redisClient,
		db:          db,
		cfg:         cfg,
		logger:      logger,
	}
}

func (s *Service) CreateOrder(studentID uint, req *CreateOrderRequest) (*database.Order, error) {
	// Verify vendor exists and is open
	vendor, err := s.repo.GetVendorByID(req.VendorID)
	if err != nil {
		return nil, errors.New("vendor not found")
	}
	if !vendor.IsOpen {
		return nil, errors.New("vendor is currently closed")
	}

	// Calculate order totals and validate items
	var subtotal float64
	var orderItems []database.OrderItem

	for _, item := range req.Items {
		menuItem, err := s.repo.GetMenuItem(item.MenuItemID, req.VendorID)
		if err != nil {
			return nil, fmt.Errorf("menu item %d not available", item.MenuItemID)
		}

		// Use discount price if available
		price := menuItem.Price
		if menuItem.DiscountPrice != nil && *menuItem.DiscountPrice > 0 {
			price = *menuItem.DiscountPrice
		}

		itemSubtotal := price * float64(item.Quantity)
		subtotal += itemSubtotal

		orderItems = append(orderItems, database.OrderItem{
			MenuItemID:          item.MenuItemID,
			Quantity:            item.Quantity,
			UnitPrice:           price,
			Subtotal:            itemSubtotal,
			SpecialInstructions: item.SpecialInstructions,
		})
	}

	// Check minimum order
	if subtotal < vendor.MinimumOrder {
		return nil, fmt.Errorf("minimum order amount is %.2f", vendor.MinimumOrder)
	}

	// Calculate fees
	deliveryFee := s.cfg.DeliveryFee
	serviceFee := subtotal * s.cfg.ServiceFeeRate
	commissionAmount := subtotal * vendor.CommissionRate
	vendorEarnings := subtotal - commissionAmount
	riderEarnings := deliveryFee * s.cfg.RiderEarningsRate
	totalAmount := subtotal + deliveryFee + serviceFee

	// Generate order number
	orderNumber := pkg.GenerateOrderNumber()

	// Resolve student record (studentID param is authenticated user ID)
	student, err := s.repo.GetStudentByUserID(studentID)
	if err != nil {
		return nil, errors.New("student profile not found")
	}

	// Log student resolution and verify student record exists
	var studentCount int64
	s.db.Model(&database.Student{}).Where("id = ?", student.ID).Count(&studentCount)
	s.logger.Info("Resolved student for order creation",
		zap.Uint("auth_user_id", studentID),
		zap.Uint("student_id", student.ID),
		zap.Uint("student_user_id", student.UserID),
		zap.Int64("student_row_count", studentCount),
	)

	// Create order within transaction
	tx := s.db.Begin()

	order := &database.Order{
		OrderNumber:         orderNumber,
		StudentID:           student.ID,
		VendorID:            req.VendorID,
		Status:              database.OrderStatusPending,
		Subtotal:            subtotal,
		DeliveryFee:         deliveryFee,
		ServiceFee:          serviceFee,
		TotalAmount:         totalAmount,
		CommissionAmount:    commissionAmount,
		VendorEarnings:      vendorEarnings,
		RiderEarnings:       riderEarnings,
		DeliveryAddress:     req.DeliveryAddress,
		DeliveryBlock:       req.DeliveryBlock,
		DeliveryDorm:        req.DeliveryDorm,
		CustomerPhone:       req.CustomerPhone,
		CustomerIDNumber:    req.CustomerIDNumber,
		DeliveryLat:         req.DeliveryLat,
		DeliveryLng:         req.DeliveryLng,
		SpecialInstructions: req.SpecialInstructions,
		OrderItems:          orderItems,
	}

	if err := tx.Create(order).Error; err != nil {
		tx.Rollback()
		s.logger.Error("Failed to create order", zap.Error(err))
		return nil, errors.New("failed to create order")
	}

	// Create payment record
	payment := &database.Payment{
		OrderID:       order.ID,
		Amount:        totalAmount,
		PaymentMethod: req.PaymentMethod,
		PaymentStatus: string(database.PaymentStatusPending),
		TransactionID: pkg.GenerateTransactionID(),
	}
	if err := tx.Create(payment).Error; err != nil {
		tx.Rollback()
		s.logger.Error("Failed to create payment", zap.Error(err))
		return nil, errors.New("failed to create payment record")
	}

	if err := tx.Commit().Error; err != nil {
		return nil, errors.New("failed to complete order creation")
	}

	// Cache active order
	ctx := context.Background()
	s.redisClient.CacheActiveOrder(ctx, order.ID, order, 30*time.Minute)

	// Send notifications
	s.notifier.NotifyVendor(vendor.UserID, "New Order",
		fmt.Sprintf("New order #%s received", order.OrderNumber),
		"order_received", fmt.Sprintf("%d", order.ID))

	// studentID (param) is the authenticated user id; notify the user
	s.notifier.NotifyStudent(studentID, "Order Confirmed",
		fmt.Sprintf("Your order #%s has been placed successfully", order.OrderNumber),
		"order_placed", fmt.Sprintf("%d", order.ID))

	// Notify admin
	s.notifier.NotifyAdmin("New Order Placed",
		fmt.Sprintf("A new order #%s has been placed", order.OrderNumber))

	return order, nil
}

func (s *Service) GetOrder(userID uint, userRole string, orderID uint) (*database.Order, error) {
	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return nil, errors.New("order not found")
	}

	// Check authorization
	switch userRole {
	case "student":
		if order.Student.UserID != userID {
			return nil, errors.New("unauthorized to view this order")
		}
	case "vendor":
		if order.Vendor.UserID != userID {
			return nil, errors.New("unauthorized to view this order")
		}
	case "rider":
		if order.AssignedRiderID == nil || *order.AssignedRiderID != userID {
			return nil, errors.New("unauthorized to view this order")
		}
	case "admin":
		// Admin can view all orders
	default:
		return nil, errors.New("unauthorized")
	}

	return order, nil
}

func (s *Service) GetStudentOrders(studentID uint, page, limit int) ([]database.Order, int64, error) {
	offset := (page - 1) * limit
	return s.repo.GetStudentOrders(studentID, offset, limit)
}

func (s *Service) GetVendorOrders(vendorID uint, status string, page, limit int) ([]database.Order, int64, error) {
	vendor, err := s.repo.GetVendorByID(vendorID)
	if err != nil {
		return nil, 0, errors.New("vendor not found")
	}
	offset := (page - 1) * limit
	return s.repo.GetVendorOrders(vendor.ID, status, offset, limit)
}

func (s *Service) GetRiderOrders(riderID uint, status string) ([]database.Order, error) {
	return s.repo.GetRiderOrders(riderID, status)
}

func (s *Service) UpdateOrderStatus(updaterID uint, role string, orderID uint,
	status database.OrderStatus, reason string) error {

	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return errors.New("order not found")
	}

	// Validate role-based permissions and state transitions
	if err := s.validateStatusUpdate(order, updaterID, role, status); err != nil {
		return err
	}

	// Prepare updates
	updates := map[string]interface{}{
		"status": status,
	}

	now := time.Now()
	switch status {
	case database.OrderStatusConfirmed:
		updates["confirmed_at"] = now
	case database.OrderStatusPreparing:
		updates["prepared_at"] = now
	case database.OrderStatusReady:
		updates["ready_at"] = now
	case database.OrderStatusPickedUp:
		updates["picked_up_at"] = now
	case database.OrderStatusDelivered:
		updates["delivered_at"] = now
	case database.OrderStatusCancelled, database.OrderStatusRejected:
		updates["cancelled_at"] = now
		updates["cancellation_reason"] = reason
	}

	// Update order status
	if err := s.repo.UpdateOrderStatus(orderID, status, updates); err != nil {
		s.logger.Error("Failed to update order status", zap.Error(err))
		return errors.New("failed to update order status")
	}

	// Handle rider availability and earnings
	if status == database.OrderStatusDelivered {
		if order.AssignedRiderID != nil {
			// Update rider availability
			s.repo.UpdateRiderAvailability(*order.AssignedRiderID, true)

			// Update vendor stats
			s.db.Model(&database.Vendor{}).Where("id = ?", order.VendorID).
				Updates(map[string]interface{}{
					"total_orders":    gorm.Expr("total_orders + ?", 1),
					"total_revenue":   gorm.Expr("total_revenue + ?", order.Subtotal),
					"total_earnings":  gorm.Expr("total_earnings + ?", order.VendorEarnings),
					"current_balance": gorm.Expr("current_balance + ?", order.VendorEarnings),
				})

			// Update student stats (order.StudentID is Student.ID)
			s.db.Model(&database.Student{}).Where("id = ?", order.StudentID).
				Updates(map[string]interface{}{
					"total_orders": gorm.Expr("total_orders + ?", 1),
					"total_spent":  gorm.Expr("total_spent + ?", order.TotalAmount),
				})
		}
	}

	// Handle cancellation/rejection
	if status == database.OrderStatusCancelled || status == database.OrderStatusRejected {
		if order.AssignedRiderID != nil {
			s.repo.UpdateRiderAvailability(*order.AssignedRiderID, true)
		}
	}

	// Remove from cache
	ctx := context.Background()
	s.redisClient.RemoveActiveOrder(ctx, orderID)

	// Send notifications
	s.notifier.NotifyOrderUpdate(order, status, reason)

	return nil
}

func (s *Service) CancelOrder(userID uint, role string, orderID uint, reason string) error {
	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return errors.New("order not found")
	}

	// Check if order can be cancelled
	if order.Status != database.OrderStatusPending &&
		order.Status != database.OrderStatusConfirmed {
		return errors.New("order cannot be cancelled in current status")
	}

	// Check authorization
	switch role {
	case "student":
		if order.Student.UserID != userID {
			return errors.New("unauthorized to cancel this order")
		}
	case "vendor":
		if order.Vendor.UserID != userID {
			return errors.New("unauthorized to cancel this order")
		}
	case "admin":
		// Admin can cancel any order
	default:
		return errors.New("unauthorized")
	}

	return s.UpdateOrderStatus(userID, role, orderID, database.OrderStatusCancelled, reason)
}

func (s *Service) TrackOrder(userID uint, orderID uint) (*TrackingInfo, error) {
	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return nil, errors.New("order not found")
	}

	// Check authorization (student, vendor, rider, admin)
	if order.Student.UserID != userID &&
		order.Vendor.UserID != userID &&
		(order.AssignedRiderID == nil || *order.AssignedRiderID != userID) {
		return nil, errors.New("unauthorized to track this order")
	}

	tracking := &TrackingInfo{
		OrderNumber:       order.OrderNumber,
		Status:            order.Status,
		EstimatedDelivery: order.EstimatedDeliveryTime,
	}

	// Vendor info
	tracking.Vendor.Name = order.Vendor.BusinessName
	tracking.Vendor.Latitude = order.Vendor.Latitude
	tracking.Vendor.Longitude = order.Vendor.Longitude

	// Include customer delivery details for driver
	tracking.DeliveryBlock = order.DeliveryBlock
	tracking.DeliveryDorm = order.DeliveryDorm
	tracking.CustomerPhone = order.CustomerPhone
	tracking.CustomerIDNumber = order.CustomerIDNumber

	// Rider info if assigned
	if order.AssignedRider != nil {
		tracking.Rider = &struct {
			Name      string  `json:"name"`
			Phone     string  `json:"phone"`
			Latitude  float64 `json:"latitude"`
			Longitude float64 `json:"longitude"`
		}{
			Name:      order.AssignedRider.User.FirstName + " " + order.AssignedRider.User.LastName,
			Phone:     order.AssignedRider.User.Phone,
			Latitude:  order.AssignedRider.CurrentLatitude,
			Longitude: order.AssignedRider.CurrentLongitude,
		}
	}

	// Build timeline
	tracking.Timeline = s.buildTimeline(order)

	return tracking, nil
}

func (s *Service) RateOrder(studentID uint, orderID uint, req *RateOrderRequest) error {
	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return errors.New("order not found")
	}

	if order.Student.UserID != studentID {
		return errors.New("unauthorized to rate this order")
	}

	if order.Status != database.OrderStatusDelivered {
		return errors.New("only delivered orders can be rated")
	}

	// Check if already rated
	var existingReview database.Review
	err = s.db.Where("order_id = ?", orderID).First(&existingReview).Error
	if err == nil {
		return errors.New("order already rated")
	}

	// Create review
	review := &database.Review{
		OrderID:   orderID,
		StudentID: studentID,
		VendorID:  order.VendorID,
		RiderID:   order.AssignedRiderID,
		Rating:    req.Rating,
		Comment:   req.Comment,
	}

	tx := s.db.Begin()
	if err := tx.Create(review).Error; err != nil {
		tx.Rollback()
		return errors.New("failed to save rating")
	}

	// Update vendor rating
	if err := s.repo.UpdateVendorRating(order.VendorID); err != nil {
		tx.Rollback()
		return errors.New("failed to update vendor rating")
	}

	// Update rider rating if exists
	if order.AssignedRiderID != nil {
		if err := s.repo.UpdateRiderRating(*order.AssignedRiderID); err != nil {
			tx.Rollback()
			return errors.New("failed to update rider rating")
		}
	}

	return tx.Commit().Error
}

func (s *Service) validateStatusUpdate(order *database.Order, updaterID uint, role string, newStatus database.OrderStatus) error {
	// Check authorization
	switch role {
	case "vendor":
		if order.Vendor.UserID != updaterID {
			return errors.New("unauthorized to update this order")
		}
		// Vendor allowed transitions
		allowed := map[database.OrderStatus]bool{
			database.OrderStatusConfirmed: true,
			database.OrderStatusPreparing: true,
			database.OrderStatusReady:     true,
			database.OrderStatusRejected:  true,
		}
		if !allowed[newStatus] {
			return errors.New("vendor cannot set this status")
		}
	case "rider":
		if order.AssignedRiderID == nil || *order.AssignedRiderID != updaterID {
			return errors.New("unauthorized to update this order")
		}
		// Rider allowed transitions
		allowed := map[database.OrderStatus]bool{
			database.OrderStatusPickedUp:  true,
			database.OrderStatusDelivered: true,
		}
		if !allowed[newStatus] {
			return errors.New("rider cannot set this status")
		}
	case "admin":
		// Admin can set any status
	default:
		return errors.New("unauthorized role")
	}

	// Validate state transition
	validTransitions := map[database.OrderStatus][]database.OrderStatus{
		database.OrderStatusPending:   {database.OrderStatusConfirmed, database.OrderStatusRejected, database.OrderStatusCancelled},
		database.OrderStatusConfirmed: {database.OrderStatusPreparing, database.OrderStatusCancelled},
		database.OrderStatusPreparing: {database.OrderStatusReady, database.OrderStatusCancelled},
		database.OrderStatusReady:     {database.OrderStatusPickedUp},
		database.OrderStatusPickedUp:  {database.OrderStatusDelivered},
	}

	allowed, ok := validTransitions[order.Status]
	if !ok {
		return errors.New("invalid current status")
	}

	for _, s := range allowed {
		if s == newStatus {
			return nil
		}
	}

	return errors.New("invalid status transition")
}

func (s *Service) buildTimeline(order *database.Order) []TrackingEvent {
	var timeline []TrackingEvent

	if !order.CreatedAt.IsZero() {
		timeline = append(timeline, TrackingEvent{
			Status:    database.OrderStatusPending,
			Timestamp: order.CreatedAt,
			Note:      "Order placed",
		})
	}

	if order.ConfirmedAt != nil {
		timeline = append(timeline, TrackingEvent{
			Status:    database.OrderStatusConfirmed,
			Timestamp: *order.ConfirmedAt,
			Note:      "Order confirmed by vendor",
		})
	}

	if order.PreparedAt != nil {
		timeline = append(timeline, TrackingEvent{
			Status:    database.OrderStatusPreparing,
			Timestamp: *order.PreparedAt,
			Note:      "Food is being prepared",
		})
	}

	if order.ReadyAt != nil {
		timeline = append(timeline, TrackingEvent{
			Status:    database.OrderStatusReady,
			Timestamp: *order.ReadyAt,
			Note:      "Order ready for pickup",
		})
	}

	if order.PickedUpAt != nil {
		timeline = append(timeline, TrackingEvent{
			Status:    database.OrderStatusPickedUp,
			Timestamp: *order.PickedUpAt,
			Note:      "Order picked up by rider",
		})
	}

	if order.DeliveredAt != nil {
		timeline = append(timeline, TrackingEvent{
			Status:    database.OrderStatusDelivered,
			Timestamp: *order.DeliveredAt,
			Note:      "Order delivered",
		})
	}

	if order.CancelledAt != nil {
		timeline = append(timeline, TrackingEvent{
			Status:    database.OrderStatusCancelled,
			Timestamp: *order.CancelledAt,
			Note:      order.CancellationReason,
		})
	}

	return timeline
}

// Add this method to handle rider rejection

func (s *Service) HandleRiderRejection(orderID uint, riderID uint) error {
	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return errors.New("order not found")
	}

	if order.AssignedRiderID == nil || *order.AssignedRiderID != riderID {
		return errors.New("rider not assigned to this order")
	}

	// Free up rider
	s.repo.UpdateRiderAvailability(riderID, true)

	// Track rejection count (you might want to add this to Order model)
	// For now, try to assign to next rider
	order.AssignedRiderID = nil
	if err := s.repo.UpdateOrderStatus(orderID, order.Status, map[string]interface{}{"assigned_rider_id": nil}); err != nil {
		return err
	}

	// Try to assign to next available rider
	if err := s.autoAssignRider(order); err != nil {
		// If second attempt fails, notify admin
		s.notifier.NotifyAdmin("Order Needs Manual Assignment",
			fmt.Sprintf("Order #%s has been rejected by riders. Manual assignment required.", order.OrderNumber))
	}

	return nil
}
