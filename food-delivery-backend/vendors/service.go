package vendors

import (
	"context"
	"errors"
	"fmt"
	"food-delivery-backend/database"
	"food-delivery-backend/notifications"
	"food-delivery-backend/redis"
	"time"

	"go.uber.org/zap"
)

type Service struct {
	repo        *Repository
	notifier    *notifications.Service
	redisClient *redis.RedisClient
	logger      *zap.Logger
}

func NewService(repo *Repository, notifier *notifications.Service, redisClient *redis.RedisClient, logger *zap.Logger) *Service {
	return &Service{
		repo:        repo,
		notifier:    notifier,
		redisClient: redisClient,
		logger:      logger,
	}
}

func (s *Service) GetVendorProfile(vendorID uint) (*database.Vendor, error) {
	vendor, err := s.repo.GetVendorByUserID(vendorID)
	if err != nil {
		s.logger.Error("Failed to get vendor profile", zap.Error(err))
		return nil, errors.New("vendor not found")
	}
	return vendor, nil
}

func (s *Service) UpdateVendorProfile(vendorID uint, req *UpdateVendorRequest) (*database.Vendor, error) {
	vendor, err := s.repo.GetVendorByUserID(vendorID)
	if err != nil {
		return nil, errors.New("vendor not found")
	}

	// Update fields if provided
	if req.BusinessName != "" {
		vendor.BusinessName = req.BusinessName
	}
	if req.BusinessAddress != "" {
		vendor.BusinessAddress = req.BusinessAddress
	}
	if req.Phone != "" {
		vendor.Phone = req.Phone
	}
	if req.Description != "" {
		vendor.Description = req.Description
	}
	if req.LogoURL != "" {
		vendor.LogoURL = req.LogoURL
	}
	if req.CoverImageURL != "" {
		vendor.CoverImageURL = req.CoverImageURL
	}
	if req.DeliveryRadius != 0 {
		vendor.DeliveryRadius = req.DeliveryRadius
	}
	if req.MinimumOrder != 0 {
		vendor.MinimumOrder = req.MinimumOrder
	}

	if err := s.repo.UpdateVendor(vendor); err != nil {
		s.logger.Error("Failed to update vendor", zap.Error(err))
		return nil, errors.New("failed to update profile")
	}

	return vendor, nil
}

func (s *Service) ToggleOpenStatus(vendorID uint) (bool, error) {
	vendor, err := s.repo.GetVendorByUserID(vendorID)
	if err != nil {
		return false, errors.New("vendor not found")
	}

	vendor.IsOpen = !vendor.IsOpen

	if err := s.repo.UpdateVendor(vendor); err != nil {
		s.logger.Error("Failed to toggle vendor status", zap.Error(err))
		return false, errors.New("failed to update status")
	}

	// Update Redis cache
	if s.redisClient != nil {
		ctx := context.Background()
		s.redisClient.SetVendorStatus(ctx, vendor.ID, vendor.IsOpen)
	}

	return vendor.IsOpen, nil
}

func (s *Service) GetMenuItems(vendorID uint) ([]database.MenuItem, error) {
	// vendorID parameter is the authenticated user id in handlers.
	// Resolve to actual Vendor.ID before fetching menu items.
	vendor, err := s.repo.GetVendorByUserID(vendorID)
	if err != nil {
		s.logger.Error("Failed to resolve vendor for menu fetch", zap.Error(err))
		return nil, errors.New("vendor not found")
	}
	return s.repo.GetMenuItems(vendor.ID)
}

func (s *Service) AddMenuItem(vendorID uint, req *AddMenuItemRequest) (*database.MenuItem, error) {
	vendor, err := s.repo.GetVendorByUserID(vendorID)
	if err != nil {
		return nil, errors.New("vendor not found")
	}

	item := &database.MenuItem{
		VendorID:        vendor.ID,
		Name:            req.Name,
		Description:     req.Description,
		Category:        req.Category,
		Price:           req.Price,
		DiscountPrice:   req.DiscountPrice,
		ImageURL:        req.ImageURL,
		PreparationTime: req.PreparationTime,
		Calories:        req.Calories,
		IsVegetarian:    req.IsVegetarian,
		IsSpicy:         req.IsSpicy,
		IsAvailable:     true,
	}

	if err := s.repo.CreateMenuItem(item); err != nil {
		s.logger.Error("Failed to create menu item", zap.Error(err))
		return nil, errors.New("failed to add menu item")
	}

	return item, nil
}

func (s *Service) UpdateMenuItem(vendorID uint, itemID uint, req *UpdateMenuItemRequest) (*database.MenuItem, error) {
	item, err := s.repo.GetMenuItemByID(itemID)
	if err != nil {
		return nil, errors.New("menu item not found")
	}

	// Verify ownership
	vendor, err := s.repo.GetVendorByUserID(vendorID)
	if err != nil || item.VendorID != vendor.ID {
		return nil, errors.New("unauthorized to update this item")
	}

	// Update fields if provided
	if req.Name != "" {
		item.Name = req.Name
	}
	if req.Description != "" {
		item.Description = req.Description
	}
	if req.Category != "" {
		item.Category = req.Category
	}
	if req.Price != 0 {
		item.Price = req.Price
	}
	if req.DiscountPrice != nil {
		item.DiscountPrice = req.DiscountPrice
	}
	if req.ImageURL != "" {
		item.ImageURL = req.ImageURL
	}
	if req.PreparationTime != 0 {
		item.PreparationTime = req.PreparationTime
	}
	if req.Calories != 0 {
		item.Calories = req.Calories
	}
	if req.IsAvailable != nil {
		item.IsAvailable = *req.IsAvailable
	}
	item.IsVegetarian = req.IsVegetarian
	item.IsSpicy = req.IsSpicy

	if err := s.repo.UpdateMenuItem(item); err != nil {
		s.logger.Error("Failed to update menu item", zap.Error(err))
		return nil, errors.New("failed to update menu item")
	}

	return item, nil
}

func (s *Service) DeleteMenuItem(vendorID uint, itemID uint) error {
	item, err := s.repo.GetMenuItemByID(itemID)
	if err != nil {
		return errors.New("menu item not found")
	}

	// Verify ownership
	vendor, err := s.repo.GetVendorByUserID(vendorID)
	if err != nil || item.VendorID != vendor.ID {
		return errors.New("unauthorized to delete this item")
	}

	return s.repo.DeleteMenuItem(itemID)
}

func (s *Service) ToggleMenuItemAvailability(vendorID uint, itemID uint) (bool, error) {
	item, err := s.repo.GetMenuItemByID(itemID)
	if err != nil {
		return false, errors.New("menu item not found")
	}

	// Verify ownership
	vendor, err := s.repo.GetVendorByUserID(vendorID)
	if err != nil || item.VendorID != vendor.ID {
		return false, errors.New("unauthorized to modify this item")
	}

	item.IsAvailable = !item.IsAvailable

	if err := s.repo.UpdateMenuItem(item); err != nil {
		s.logger.Error("Failed to toggle menu item availability", zap.Error(err))
		return false, errors.New("failed to update availability")
	}

	return item.IsAvailable, nil
}

func (s *Service) GetOrders(vendorID uint, status string, page, limit int) ([]database.Order, int64, error) {
	vendor, err := s.repo.GetVendorByUserID(vendorID)
	if err != nil {
		return nil, 0, errors.New("vendor not found")
	}

	offset := (page - 1) * limit
	return s.repo.GetOrders(vendor.ID, status, offset, limit)
}

func (s *Service) GetOrder(vendorID uint, orderID uint) (*database.Order, error) {
	vendor, err := s.repo.GetVendorByUserID(vendorID)
	if err != nil {
		return nil, errors.New("vendor not found")
	}

	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return nil, errors.New("order not found")
	}

	if order.VendorID != vendor.ID {
		return nil, errors.New("unauthorized to view this order")
	}

	return order, nil
}

func (s *Service) AcceptOrder(vendorID uint, orderID uint) error {
	vendor, err := s.repo.GetVendorByUserID(vendorID)
	if err != nil {
		return errors.New("vendor not found")
	}

	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return errors.New("order not found")
	}

	if order.VendorID != vendor.ID {
		return errors.New("unauthorized to accept this order")
	}

	if order.Status != database.OrderStatusPending {
		return errors.New("order cannot be accepted in current status")
	}

	now := time.Now()
	if err := s.repo.UpdateOrderStatus(orderID, database.OrderStatusConfirmed, &now); err != nil {
		return err
	}

	// Reload and notify
	if s.notifier != nil {
		updated, err := s.repo.GetOrderByID(orderID)
		if err == nil {
			s.notifier.NotifyOrderUpdate(updated, database.OrderStatusConfirmed, "")
			s.notifier.NotifyAdmin("Order Accepted",
				fmt.Sprintf("Order #%s was accepted by the vendor", updated.OrderNumber))
		}
	}

	return nil
}

func (s *Service) RejectOrder(vendorID uint, orderID uint, reason string) error {
	vendor, err := s.repo.GetVendorByUserID(vendorID)
	if err != nil {
		return errors.New("vendor not found")
	}

	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return errors.New("order not found")
	}

	if order.VendorID != vendor.ID {
		return errors.New("unauthorized to reject this order")
	}

	if order.Status != database.OrderStatusPending {
		return errors.New("order cannot be rejected in current status")
	}

	now := time.Now()
	return s.repo.UpdateOrderStatus(orderID, database.OrderStatusRejected, &now)
}

func (s *Service) MarkOrderReady(vendorID uint, orderID uint) error {
	vendor, err := s.repo.GetVendorByUserID(vendorID)
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
	return s.repo.UpdateOrderStatus(orderID, database.OrderStatusReady, &now)
}

func (s *Service) GetEarnings(vendorID uint, startDateStr, endDateStr string) (*EarningsResponse, error) {
	vendor, err := s.repo.GetVendorByUserID(vendorID)
	if err != nil {
		return nil, errors.New("vendor not found")
	}

	// Parse dates or set defaults
	var startDate, endDate time.Time
	if startDateStr != "" {
		startDate, err = time.Parse("2006-01-02", startDateStr)
		if err != nil {
			return nil, errors.New("invalid start date format")
		}
	} else {
		// Default to last 30 days
		startDate = time.Now().AddDate(0, 0, -30)
	}

	if endDateStr != "" {
		endDate, err = time.Parse("2006-01-02", endDateStr)
		if err != nil {
			return nil, errors.New("invalid end date format")
		}
	} else {
		endDate = time.Now()
	}

	// Set to end of day
	endDate = endDate.Add(24*time.Hour - time.Second)

	orders, err := s.repo.GetEarnings(vendor.ID, startDate, endDate)
	if err != nil {
		s.logger.Error("Failed to get earnings", zap.Error(err))
		return nil, errors.New("failed to calculate earnings")
	}

	// Calculate summary
	response := &EarningsResponse{}
	response.Period.StartDate = startDate.Format("2006-01-02")
	response.Period.EndDate = endDate.Format("2006-01-02")

	dailyMap := make(map[string]*DailyEarnings)
	var totalOrders int
	var totalRevenue, totalCommission, totalEarnings float64

	for _, order := range orders {
		date := order.CreatedAt.Format("2006-01-02")
		if _, exists := dailyMap[date]; !exists {
			dailyMap[date] = &DailyEarnings{
				Date: date,
			}
		}

		daily := dailyMap[date]
		daily.Orders++
		daily.Revenue += order.Subtotal
		daily.Commission += order.CommissionAmount
		daily.Earnings += order.VendorEarnings

		totalOrders++
		totalRevenue += order.Subtotal
		totalCommission += order.CommissionAmount
		totalEarnings += order.VendorEarnings
	}

	// Convert map to slice
	for _, daily := range dailyMap {
		response.DailyBreakdown = append(response.DailyBreakdown, *daily)
	}

	response.Summary.TotalOrders = totalOrders
	response.Summary.TotalRevenue = totalRevenue
	response.Summary.TotalCommission = totalCommission
	response.Summary.TotalEarnings = totalEarnings
	if totalOrders > 0 {
		response.Summary.AverageOrderValue = totalRevenue / float64(totalOrders)
	}

	// Get current balance
	balance, _ := s.repo.GetVendorBalance(vendor.ID)
	response.CurrentBalance = balance

	return response, nil
}

// GetPublicVendors returns all active vendors for public viewing
func (s *Service) GetPublicVendors(page, limit int) ([]database.Vendor, int64, error) {
	offset := (page - 1) * limit
	return s.repo.GetPublicVendors(offset, limit)
}

// GetPublicMenu returns a vendor's menu for public viewing
// GetPublicMenu returns a vendor's menu for public viewing
func (s *Service) GetPublicMenu(vendorID uint) ([]database.MenuItem, error) {
	// Verify vendor exists and is active
	vendor, err := s.repo.GetVendorByID(vendorID)
	if err != nil {
		return nil, errors.New("vendor not found")
	}

	// Check if vendor is open
	if !vendor.IsOpen {
		return nil, errors.New("vendor is currently closed")
	}

	// Return only available menu items
	return s.repo.GetPublicMenuItems(vendorID)
}

// GetPublicMenuItem returns a single menu item for public viewing
func (s *Service) GetPublicMenuItem(itemID uint) (*database.MenuItem, error) {
	item, err := s.repo.GetPublicMenuItemByID(itemID)
	if err != nil {
		return nil, errors.New("menu item not found")
	}
	return item, nil
}

// Add this method to vendors/service.go

func (s *Service) UpdateOrderStatus(vendorID uint, orderID uint, status string) error {
	s.logger.Info("Vendor UpdateOrderStatus called", zap.Uint("vendor_user_id", vendorID), zap.Uint("order_id", orderID), zap.String("requested_status", status))

	vendor, err := s.repo.GetVendorByUserID(vendorID)
	if err != nil {
		s.logger.Error("Vendor not found for UpdateOrderStatus", zap.Error(err), zap.Uint("vendor_user_id", vendorID))
		return errors.New("vendor not found")
	}

	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		s.logger.Error("Order not found for UpdateOrderStatus", zap.Error(err), zap.Uint("vendor_user_id", vendorID), zap.Uint("order_id", orderID))
		return errors.New("order not found")
	}

	if order.VendorID != vendor.ID {
		return errors.New("unauthorized to update this order")
	}

	// Validate status transition
	if order.Status != database.OrderStatusConfirmed && status == "preparing" {
		return errors.New("order must be confirmed before starting preparation")
	}

	if order.Status != database.OrderStatusPreparing && status == "ready" {
		return errors.New("order must be in preparing status to mark as ready")
	}

	var newStatus database.OrderStatus
	switch status {
	case "preparing":
		newStatus = database.OrderStatusPreparing
	case "ready":
		newStatus = database.OrderStatusReady
	default:
		s.logger.Error("Invalid status requested for UpdateOrderStatus", zap.String("status", status))
		return errors.New("invalid status")
	}

	now := time.Now()
	return s.repo.UpdateOrderStatus(orderID, newStatus, &now)
}
