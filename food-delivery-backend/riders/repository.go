package riders

import (
	"food-delivery-backend/database"
	"time"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetRiderByUserID(userID uint) (*database.Rider, error) {
	var rider database.Rider
	err := r.db.Preload("User").Where("user_id = ?", userID).First(&rider).Error
	return &rider, err
}

func (r *Repository) UpdateRider(rider *database.Rider) error {
	return r.db.Save(rider).Error
}

func (r *Repository) UpdateLocation(riderID uint, lat, lng float64) error {
	now := time.Now()
	return r.db.Model(&database.Rider{}).Where("id = ?", riderID).Updates(map[string]interface{}{
		"current_latitude":     lat,
		"current_longitude":    lng,
		"last_location_update": now,
	}).Error
}

func (r *Repository) GetAssignedOrders(riderID uint, status string) ([]database.Order, error) {
	var orders []database.Order
	query := r.db.Where("assigned_rider_id = ?", riderID).
		Preload("Student.User").
		Preload("Vendor").
		Preload("OrderItems.MenuItem").
		Order("created_at DESC")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	err := query.Find(&orders).Error
	return orders, err
}

func (r *Repository) GetOrderByID(orderID uint) (*database.Order, error) {
	var order database.Order
	err := r.db.Preload("Student.User").
		Preload("Vendor").
		Preload("OrderItems.MenuItem").
		First(&order, orderID).Error
	return &order, err
}

func (r *Repository) UpdateOrderStatus(orderID uint, status database.OrderStatus, timestamp *time.Time) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if timestamp != nil {
		switch status {
		case database.OrderStatusPickedUp:
			updates["picked_up_at"] = timestamp
		case database.OrderStatusDelivered:
			updates["delivered_at"] = timestamp
		}
	}
	return r.db.Model(&database.Order{}).Where("id = ?", orderID).Updates(updates).Error
}

func (r *Repository) GetEarnings(riderID uint, startDate, endDate time.Time) ([]database.Order, error) {
	var orders []database.Order
	err := r.db.Where("assigned_rider_id = ? AND status = ? AND delivered_at BETWEEN ? AND ?",
		riderID, database.OrderStatusDelivered, startDate, endDate).
		Order("delivered_at ASC").
		Find(&orders).Error
	return orders, err
}

func (r *Repository) GetDeliveryHistory(riderID uint, offset, limit int) ([]database.Order, int64, error) {
	var orders []database.Order
	var total int64

	r.db.Model(&database.Order{}).Where("assigned_rider_id = ? AND status = ?",
		riderID, database.OrderStatusDelivered).Count(&total)

	err := r.db.Where("assigned_rider_id = ? AND status = ?", riderID, database.OrderStatusDelivered).
		Preload("Student.User").
		Preload("Vendor").
		Order("delivered_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&orders).Error

	return orders, total, err
}

func (r *Repository) GetRiderBalance(riderID uint) (float64, error) {
	var rider database.Rider
	err := r.db.Select("current_balance").First(&rider, riderID).Error
	return rider.CurrentBalance, err
}

func (r *Repository) GetAvailableOrders(offset, limit int) ([]database.Order, int64, error) {
	var orders []database.Order
	var total int64

	query := r.db.Model(&database.Order{}).Where("status = ? AND assigned_rider_id IS NULL", database.OrderStatusReady)
	query.Count(&total)

	err := query.Preload("Student.User").
		Preload("Vendor").
		Preload("OrderItems.MenuItem").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&orders).Error

	return orders, total, err
}

func (r *Repository) AssignOrderToRider(orderID uint, riderID uint) error {
	// Only assign if currently unassigned
	return r.db.Model(&database.Order{}).Where("id = ? AND assigned_rider_id IS NULL", orderID).
		Updates(map[string]interface{}{"assigned_rider_id": riderID}).Error
}
