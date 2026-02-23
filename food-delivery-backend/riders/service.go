package riders

import (
	"context"
	"errors"
	"food-delivery-backend/database"
	"food-delivery-backend/redis"
	"time"

	"go.uber.org/zap"
)

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

func (s *Service) GetRiderProfile(riderID uint) (*database.Rider, error) {
	rider, err := s.repo.GetRiderByUserID(riderID)
	if err != nil {
		s.logger.Error("Failed to get rider profile", zap.Error(err))
		return nil, errors.New("rider not found")
	}
	return rider, nil
}

func (s *Service) UpdateRiderProfile(riderID uint, req *UpdateRiderRequest) (*database.Rider, error) {
	rider, err := s.repo.GetRiderByUserID(riderID)
	if err != nil {
		return nil, errors.New("rider not found")
	}

	if req.VehicleNumber != "" {
		rider.VehicleNumber = req.VehicleNumber
	}
	if req.VehicleType != "" {
		rider.VehicleType = req.VehicleType
	}
	if req.Phone != "" {
		rider.User.Phone = req.Phone
	}

	if err := s.repo.UpdateRider(rider); err != nil {
		s.logger.Error("Failed to update rider", zap.Error(err))
		return nil, errors.New("failed to update profile")
	}

	return rider, nil
}

func (s *Service) UpdateLocation(riderID uint, lat, lng float64) error {
	rider, err := s.repo.GetRiderByUserID(riderID)
	if err != nil {
		return errors.New("rider not found")
	}

	// Update in database
	if err := s.repo.UpdateLocation(rider.ID, lat, lng); err != nil {
		s.logger.Error("Failed to update rider location", zap.Error(err))
		return errors.New("failed to update location")
	}

	// Update in Redis if rider is available
	if rider.IsAvailable {
		ctx := context.Background()
		s.redisClient.SetRiderAvailable(ctx, rider.ID, lat, lng)
	}

	return nil
}

func (s *Service) ToggleAvailability(riderID uint) (bool, error) {
	rider, err := s.repo.GetRiderByUserID(riderID)
	if err != nil {
		return false, errors.New("rider not found")
	}

	rider.IsAvailable = !rider.IsAvailable

	if err := s.repo.UpdateRider(rider); err != nil {
		s.logger.Error("Failed to toggle rider availability", zap.Error(err))
		return false, errors.New("failed to update availability")
	}

	// Update Redis
	ctx := context.Background()
	if rider.IsAvailable {
		s.redisClient.SetRiderAvailable(ctx, rider.ID, rider.CurrentLatitude, rider.CurrentLongitude)
	} else {
		s.redisClient.SetRiderUnavailable(ctx, rider.ID)
	}

	return rider.IsAvailable, nil
}

func (s *Service) GetAssignedOrders(riderID uint, status string) ([]database.Order, error) {
	rider, err := s.repo.GetRiderByUserID(riderID)
	if err != nil {
		return nil, errors.New("rider not found")
	}

	return s.repo.GetAssignedOrders(rider.ID, status)
}

func (s *Service) GetAvailableOrders(page, limit int) ([]database.Order, int64, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit
	return s.repo.GetAvailableOrders(offset, limit)
}

func (s *Service) ClaimOrder(riderID uint, orderID uint) error {
	rider, err := s.repo.GetRiderByUserID(riderID)
	if err != nil {
		return errors.New("rider not found")
	}

	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return errors.New("order not found")
	}

	if order.Status != database.OrderStatusReady {
		return errors.New("order is not available for claiming")
	}

	if order.AssignedRiderID != nil {
		return errors.New("order already assigned")
	}

	// Attempt to atomically set assigned rider
	if err := s.repo.AssignOrderToRider(orderID, rider.ID); err != nil {
		s.logger.Error("Failed to assign order to rider", zap.Error(err))
		return errors.New("failed to claim order")
	}

	// Mark rider unavailable in DB and Redis
	rider.IsAvailable = false
	if err := s.repo.UpdateRider(rider); err != nil {
		s.logger.Error("Failed to update rider availability after claim", zap.Error(err))
	}
	ctx := context.Background()
	s.redisClient.SetRiderUnavailable(ctx, rider.ID)

	return nil
}

func (s *Service) GetOrder(riderID uint, orderID uint) (*database.Order, error) {
	rider, err := s.repo.GetRiderByUserID(riderID)
	if err != nil {
		return nil, errors.New("rider not found")
	}

	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return nil, errors.New("order not found")
	}

	if order.AssignedRiderID == nil || *order.AssignedRiderID != rider.ID {
		return nil, errors.New("unauthorized to view this order")
	}

	return order, nil
}

func (s *Service) PickUpOrder(riderID uint, orderID uint) error {
	rider, err := s.repo.GetRiderByUserID(riderID)
	if err != nil {
		return errors.New("rider not found")
	}

	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return errors.New("order not found")
	}

	if order.AssignedRiderID == nil || *order.AssignedRiderID != rider.ID {
		return errors.New("unauthorized to pick up this order")
	}

	if order.Status != database.OrderStatusReady {
		return errors.New("order must be ready to pick up")
	}

	now := time.Now()
	return s.repo.UpdateOrderStatus(orderID, database.OrderStatusPickedUp, &now)
}

func (s *Service) DeliverOrder(riderID uint, orderID uint) error {
	rider, err := s.repo.GetRiderByUserID(riderID)
	if err != nil {
		return errors.New("rider not found")
	}

	order, err := s.repo.GetOrderByID(orderID)
	if err != nil {
		return errors.New("order not found")
	}

	if order.AssignedRiderID == nil || *order.AssignedRiderID != rider.ID {
		return errors.New("unauthorized to deliver this order")
	}

	if order.Status != database.OrderStatusPickedUp {
		return errors.New("order must be picked up first")
	}

	now := time.Now()

	// Update order status
	if err := s.repo.UpdateOrderStatus(orderID, database.OrderStatusDelivered, &now); err != nil {
		return err
	}

	// Update rider availability and earnings
	rider.IsAvailable = true
	rider.TotalDeliveries++
	rider.TotalEarnings += order.RiderEarnings
	rider.CurrentBalance += order.RiderEarnings

	if err := s.repo.UpdateRider(rider); err != nil {
		s.logger.Error("Failed to update rider after delivery", zap.Error(err))
	}

	// Update Redis availability
	ctx := context.Background()
	s.redisClient.SetRiderAvailable(ctx, rider.ID, rider.CurrentLatitude, rider.CurrentLongitude)

	return nil
}

func (s *Service) GetEarnings(riderID uint, startDateStr, endDateStr string) (*RiderEarningsResponse, error) {
	rider, err := s.repo.GetRiderByUserID(riderID)
	if err != nil {
		return nil, errors.New("rider not found")
	}

	// Parse dates or set defaults
	var startDate, endDate time.Time
	if startDateStr != "" {
		startDate, err = time.Parse("2006-01-02", startDateStr)
		if err != nil {
			return nil, errors.New("invalid start date format")
		}
	} else {
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

	endDate = endDate.Add(24*time.Hour - time.Second)

	orders, err := s.repo.GetEarnings(rider.ID, startDate, endDate)
	if err != nil {
		s.logger.Error("Failed to get rider earnings", zap.Error(err))
		return nil, errors.New("failed to calculate earnings")
	}

	response := &RiderEarningsResponse{}
	response.Period.StartDate = startDate.Format("2006-01-02")
	response.Period.EndDate = endDate.Format("2006-01-02")

	dailyMap := make(map[string]*DailyEarnings)
	var totalDeliveries int
	var totalEarnings float64

	for _, order := range orders {
		date := order.DeliveredAt.Format("2006-01-02")
		if _, exists := dailyMap[date]; !exists {
			dailyMap[date] = &DailyEarnings{
				Date: date,
			}
		}

		daily := dailyMap[date]
		daily.Deliveries++
		daily.Earnings += order.RiderEarnings

		totalDeliveries++
		totalEarnings += order.RiderEarnings
	}

	for _, daily := range dailyMap {
		response.DailyBreakdown = append(response.DailyBreakdown, *daily)
	}

	response.Summary.TotalDeliveries = totalDeliveries
	response.Summary.TotalEarnings = totalEarnings
	if totalDeliveries > 0 {
		response.Summary.AveragePerDelivery = totalEarnings / float64(totalDeliveries)
	}

	balance, _ := s.repo.GetRiderBalance(rider.ID)
	response.CurrentBalance = balance

	return response, nil
}

func (s *Service) GetDeliveryHistory(riderID uint, page, limit int) ([]database.Order, int64, error) {
	rider, err := s.repo.GetRiderByUserID(riderID)
	if err != nil {
		return nil, 0, errors.New("rider not found")
	}

	offset := (page - 1) * limit
	return s.repo.GetDeliveryHistory(rider.ID, offset, limit)
}
