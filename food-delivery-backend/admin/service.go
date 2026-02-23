package admin

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"food-delivery-backend/database"
	"food-delivery-backend/pkg"
	"food-delivery-backend/redis"

	"go.uber.org/zap"
)

var nonDigitsRegex = regexp.MustCompile(`\D+`)

func makePlaceholderEmail(rolePrefix, phone string) string {
	normalized := strings.TrimSpace(phone)
	normalized = nonDigitsRegex.ReplaceAllString(normalized, "")
	if normalized == "" {
		normalized = "user"
	}
	return fmt.Sprintf("%s_%s@food.local", rolePrefix, normalized)
}

type Service struct {
	repo        *Repository
	redisClient *redis.RedisClient
	logger      *zap.Logger
}

func NewService(repo *Repository, redisClient *redis.RedisClient, logger *zap.Logger) *Service {
	return &Service{
		repo:        repo,
		redisClient: redisClient,
		logger:      logger,
	}
}

func (s *Service) CreateVendor(req *CreateVendorRequest) (*database.Vendor, error) {
	email := strings.TrimSpace(req.Email)
	if email == "" {
		email = makePlaceholderEmail("vendor", req.Phone)
	}

	// Check if user exists (phone is the primary identifier in this app)
	var existingUser database.User
	if err := s.repo.db.Where("phone = ?", req.Phone).First(&existingUser).Error; err == nil {
		return nil, errors.New("user with this phone number already exists")
	}
	// Email column is unique + not null, so we must avoid collisions even for placeholder emails
	if err := s.repo.db.Where("email = ?", email).First(&existingUser).Error; err == nil {
		return nil, errors.New("user with this email already exists")
	}

	hashedPassword, err := pkg.HashPassword(req.Password)
	if err != nil {
		s.logger.Error("Failed to hash password", zap.Error(err))
		return nil, errors.New("failed to create vendor")
	}

	tx := s.repo.db.Begin()

	user := &database.User{
		Email:        email,
		PasswordHash: hashedPassword,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        req.Phone,
		Role:         database.RoleVendor,
		IsActive:     true,
	}

	if err := tx.Create(user).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("failed to create user")
	}

	commissionRate := req.CommissionRate
	if commissionRate == 0 {
		commissionRate = 0.15
	}

	vendor := &database.Vendor{
		UserID:          user.ID,
		BusinessName:    req.BusinessName,
		BusinessAddress: req.BusinessAddress,
		Latitude:        req.Latitude,
		Longitude:       req.Longitude,
		Phone:           req.Phone,
		CommissionRate:  commissionRate,
		IsOpen:          false,
	}

	if err := tx.Create(vendor).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("failed to create vendor profile")
	}

	if err := tx.Commit().Error; err != nil {
		return nil, errors.New("failed to complete vendor creation")
	}

	return vendor, nil
}

func (s *Service) CreateRider(req *CreateRiderRequest) (*database.Rider, error) {
	email := strings.TrimSpace(req.Email)
	if email == "" {
		email = makePlaceholderEmail("rider", req.Phone)
	}

	var existingUser database.User
	if err := s.repo.db.Where("phone = ?", req.Phone).First(&existingUser).Error; err == nil {
		return nil, errors.New("user with this phone number already exists")
	}
	if err := s.repo.db.Where("email = ?", email).First(&existingUser).Error; err == nil {
		return nil, errors.New("user with this email already exists")
	}

	hashedPassword, err := pkg.HashPassword(req.Password)
	if err != nil {
		s.logger.Error("Failed to hash password", zap.Error(err))
		return nil, errors.New("failed to create rider")
	}

	tx := s.repo.db.Begin()

	user := &database.User{
		Email:        email,
		PasswordHash: hashedPassword,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        req.Phone,
		Role:         database.RoleRider,
		IsActive:     true,
	}

	if err := tx.Create(user).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("failed to create user")
	}

	rider := &database.Rider{
		UserID:        user.ID,
		VehicleNumber: req.VehicleNumber,
		VehicleType:   req.VehicleType,
		IsAvailable:   true,
	}

	if err := tx.Create(rider).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("failed to create rider profile")
	}

	if err := tx.Commit().Error; err != nil {
		return nil, errors.New("failed to complete rider creation")
	}

	return rider, nil
}

func (s *Service) GetUsers(role string, page, limit int) ([]database.User, int64, error) {
	offset := (page - 1) * limit
	return s.repo.GetUsers(role, offset, limit)
}

func (s *Service) GetUser(userID uint) (*database.User, error) {
	return s.repo.GetUserByID(userID)
}

func (s *Service) ToggleUserStatus(userID uint) (bool, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return false, errors.New("user not found")
	}

	user.IsActive = !user.IsActive

	if err := s.repo.UpdateUser(user); err != nil {
		s.logger.Error("Failed to toggle user status", zap.Error(err))
		return false, errors.New("failed to update user status")
	}

	return user.IsActive, nil
}

func (s *Service) GetVendors(page, limit int) ([]database.Vendor, int64, error) {
	offset := (page - 1) * limit
	return s.repo.GetVendors(offset, limit)
}

func (s *Service) GetRiders(available *bool, page, limit int) ([]database.Rider, int64, error) {
	offset := (page - 1) * limit
	return s.repo.GetRiders(available, offset, limit)
}

func (s *Service) GetOrders(filters *OrderFilters, page, limit int) ([]database.Order, int64, error) {
	offset := (page - 1) * limit
	return s.repo.GetOrders(filters, offset, limit)
}

func (s *Service) GetOrder(orderID uint) (*database.Order, error) {
	return s.repo.GetOrderByID(orderID)
}

func (s *Service) AssignRider(orderID, riderID uint) error {
	var order database.Order
	if err := s.repo.db.First(&order, orderID).Error; err != nil {
		return errors.New("order not found")
	}

	var rider database.Rider
	if err := s.repo.db.First(&rider, riderID).Error; err != nil {
		return errors.New("rider not found")
	}
	if !rider.IsAvailable {
		return errors.New("rider is not available")
	}

	if err := s.repo.AssignRider(orderID, riderID); err != nil {
		s.logger.Error("Failed to assign rider", zap.Error(err))
		return errors.New("failed to assign rider")
	}

	s.repo.db.Model(&rider).Update("is_available", false)

	ctx := context.Background()
	s.redisClient.SetRiderUnavailable(ctx, riderID)

	return nil
}

func (s *Service) GetRevenueReport(startDateStr, endDateStr string) (*RevenueReport, error) {
	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		return nil, errors.New("invalid start date format")
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		return nil, errors.New("invalid end date format")
	}
	endDate = endDate.Add(24*time.Hour - time.Second)

	orders, err := s.repo.GetRevenueReport(startDate, endDate)
	if err != nil {
		s.logger.Error("Failed to get revenue report", zap.Error(err))
		return nil, errors.New("failed to generate report")
	}

	report := &RevenueReport{}
	report.Period.StartDate = startDate.Format("2006-01-02")
	report.Period.EndDate = endDate.Format("2006-01-02")

	vendorMap := make(map[uint]*VendorRevenue)
	dayMap := make(map[string]*DailyRevenue)

	var totalOrders int
	var totalRevenue, totalCommission, totalDeliveryFees float64

	for _, order := range orders {
		totalOrders++
		totalRevenue += order.Subtotal
		totalCommission += order.CommissionAmount
		totalDeliveryFees += order.DeliveryFee

		if _, exists := vendorMap[order.VendorID]; !exists {
			vendorMap[order.VendorID] = &VendorRevenue{
				VendorID:     order.VendorID,
				BusinessName: order.Vendor.BusinessName,
			}
		}
		vendor := vendorMap[order.VendorID]
		vendor.Orders++
		vendor.Revenue += order.Subtotal
		vendor.Commission += order.CommissionAmount
		vendor.Earnings += order.VendorEarnings

		date := order.CreatedAt.Format("2006-01-02")
		if _, exists := dayMap[date]; !exists {
			dayMap[date] = &DailyRevenue{Date: date}
		}
		day := dayMap[date]
		day.Orders++
		day.Revenue += order.Subtotal
	}

	report.Summary.TotalOrders = totalOrders
	report.Summary.TotalRevenue = totalRevenue
	if totalOrders > 0 {
		report.Summary.AverageOrderValue = totalRevenue / float64(totalOrders)
	}
	report.Summary.TotalCommission = totalCommission
	report.Summary.DeliveryFees = totalDeliveryFees
	report.Summary.PlatformFee = totalCommission + totalDeliveryFees

	for _, vendor := range vendorMap {
		report.ByVendor = append(report.ByVendor, *vendor)
	}
	for _, day := range dayMap {
		report.ByDay = append(report.ByDay, *day)
	}

	return report, nil
}

func (s *Service) GetDashboard(days int) (*DashboardResponse, error) {
	if days <= 0 {
		days = 14
	}

	resp := &DashboardResponse{}

	// Totals
	if err := s.repo.db.Model(&database.User{}).Count(&resp.Totals.Users).Error; err != nil {
		return nil, err
	}
	if err := s.repo.db.Model(&database.Vendor{}).Count(&resp.Totals.Vendors).Error; err != nil {
		return nil, err
	}
	if err := s.repo.db.Model(&database.Rider{}).Count(&resp.Totals.Riders).Error; err != nil {
		return nil, err
	}
	if err := s.repo.db.Model(&database.Order{}).Count(&resp.Totals.Orders).Error; err != nil {
		return nil, err
	}

	// Orders by status
	{
		type row struct {
			Status string
			Count  int64
		}
		var rows []row
		err := s.repo.db.Model(&database.Order{}).
			Select("status, COUNT(*) as count").
			Group("status").
			Scan(&rows).Error
		if err != nil {
			return nil, err
		}
		for _, r := range rows {
			resp.OrdersByStatus = append(resp.OrdersByStatus, OrdersByStatus{Status: r.Status, Count: r.Count})
		}
	}

	// Daily orders + revenue for last N days
	{
		start := time.Now().AddDate(0, 0, -days+1)
		start = time.Date(start.Year(), start.Month(), start.Day(), 0, 0, 0, 0, start.Location())
		end := time.Now()

		type row struct {
			Date    time.Time
			Orders  int64
			Revenue float64
		}
		var rows []row
		err := s.repo.db.Model(&database.Order{}).
			Select("DATE(created_at) as date, COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue").
			Where("created_at BETWEEN ? AND ?", start, end).
			Group("DATE(created_at)").
			Order("DATE(created_at) ASC").
			Scan(&rows).Error
		if err != nil {
			return nil, err
		}

		byDate := make(map[string]DailyOrders, len(rows))
		for _, r := range rows {
			key := r.Date.Format("2006-01-02")
			byDate[key] = DailyOrders{Date: key, Orders: r.Orders, Revenue: r.Revenue}
		}

		for i := 0; i < days; i++ {
			d := start.AddDate(0, 0, i).Format("2006-01-02")
			if v, ok := byDate[d]; ok {
				resp.Daily = append(resp.Daily, v)
			} else {
				resp.Daily = append(resp.Daily, DailyOrders{Date: d, Orders: 0, Revenue: 0})
			}
		}
	}

	// Recent orders
	{
		var orders []database.Order
		err := s.repo.db.Model(&database.Order{}).
			Preload("Vendor").
			Order("created_at DESC").
			Limit(10).
			Find(&orders).Error
		if err != nil {
			return nil, err
		}

		for _, o := range orders {
			resp.RecentOrders = append(resp.RecentOrders, RecentOrder{
				ID:          o.ID,
				OrderNumber: o.OrderNumber,
				Status:      string(o.Status),
				TotalAmount: o.TotalAmount,
				CreatedAt:   o.CreatedAt.Format(time.RFC3339),
				VendorName:  o.Vendor.BusinessName,
			})
		}
	}

	return resp, nil
}

func (s *Service) GetVendorPerformance(vendorID uint) (*VendorPerformance, error) {
	return s.repo.GetVendorStats(vendorID)
}

func (s *Service) GetRiderPerformance(riderID uint) (*RiderPerformance, error) {
	return s.repo.GetRiderStats(riderID)
}
