package orders

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

func (r *Repository) GetVendorByID(vendorID uint) (*database.Vendor, error) {
	var vendor database.Vendor
	err := r.db.Preload("User").First(&vendor, vendorID).Error
	return &vendor, err
}

func (r *Repository) GetMenuItem(menuItemID, vendorID uint) (*database.MenuItem, error) {
	var menuItem database.MenuItem
	err := r.db.Where("id = ? AND vendor_id = ? AND is_available = ?",
		menuItemID, vendorID, true).First(&menuItem).Error
	return &menuItem, err
}

func (r *Repository) CreateOrder(order *database.Order) error {
	return r.db.Create(order).Error
}

func (r *Repository) GetOrderByID(orderID uint) (*database.Order, error) {
	var order database.Order
	err := r.db.Preload("OrderItems.MenuItem").
		Preload("Vendor.User").
		Preload("AssignedRider.User").
		Preload("Student.User").
		Preload("Payment").
		First(&order, orderID).Error
	return &order, err
}

// GetStudentByUserID returns the student record for a given user id
func (r *Repository) GetStudentByUserID(userID uint) (*database.Student, error) {
	var student database.Student
	err := r.db.Where("user_id = ?", userID).First(&student).Error
	return &student, err
}

func (r *Repository) UpdateOrder(order *database.Order) error {
	return r.db.Save(order).Error
}

func (r *Repository) UpdateOrderStatus(orderID uint, status database.OrderStatus, updates map[string]interface{}) error {
	updates["status"] = status
	return r.db.Model(&database.Order{}).Where("id = ?", orderID).Updates(updates).Error
}

func (r *Repository) AssignRider(orderID, riderID uint) error {
	return r.db.Model(&database.Order{}).Where("id = ?", orderID).
		Updates(map[string]interface{}{
			"assigned_rider_id": riderID,
			"status":            database.OrderStatusConfirmed,
			"confirmed_at":      time.Now(),
		}).Error
}

func (r *Repository) GetAvailableRider() (*database.Rider, error) {
	var rider database.Rider
	err := r.db.Where("is_available = ?", true).
		Order("RANDOM()").
		First(&rider).Error
	return &rider, err
}

func (r *Repository) UpdateRiderAvailability(riderID uint, available bool) error {
	return r.db.Model(&database.Rider{}).Where("id = ?", riderID).
		Update("is_available", available).Error
}

func (r *Repository) GetStudentOrders(studentID uint, offset, limit int) ([]database.Order, int64, error) {
	var orders []database.Order
	var total int64

	r.db.Model(&database.Order{}).Where("student_id = ?", studentID).Count(&total)

	err := r.db.Where("student_id = ?", studentID).
		Preload("OrderItems.MenuItem").
		Preload("Vendor").
		Preload("AssignedRider.User").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&orders).Error

	return orders, total, err
}

func (r *Repository) GetVendorOrders(vendorID uint, status string, offset, limit int) ([]database.Order, int64, error) {
	var orders []database.Order
	var total int64

	query := r.db.Model(&database.Order{}).Where("vendor_id = ?", vendorID)
	if status != "" {
		query = query.Where("status = ?", status)
	}
	query.Count(&total)

	err := query.Preload("Student.User").
		Preload("OrderItems.MenuItem").
		Preload("AssignedRider.User").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&orders).Error

	return orders, total, err
}

func (r *Repository) GetRiderOrders(riderID uint, status string) ([]database.Order, error) {
	var orders []database.Order
	query := r.db.Where("assigned_rider_id = ?", riderID)
	if status != "" {
		query = query.Where("status = ?", status)
	}
	err := query.Preload("Student.User").
		Preload("Vendor").
		Preload("OrderItems.MenuItem").
		Order("created_at DESC").
		Find(&orders).Error
	return orders, err
}

func (r *Repository) CreatePayment(payment *database.Payment) error {
	return r.db.Create(payment).Error
}

func (r *Repository) UpdatePaymentStatus(orderID uint, status database.PaymentStatus, transactionID string) error {
	updates := map[string]interface{}{
		"payment_status": status,
	}
	if status == database.PaymentStatusCompleted {
		updates["paid_at"] = time.Now()
	}
	if transactionID != "" {
		updates["transaction_id"] = transactionID
	}
	return r.db.Model(&database.Payment{}).Where("order_id = ?", orderID).Updates(updates).Error
}

func (r *Repository) CreateReview(review *database.Review) error {
	return r.db.Create(review).Error
}

func (r *Repository) UpdateVendorRating(vendorID uint) error {
	var avgRating float64
	r.db.Model(&database.Review{}).Where("vendor_id = ?", vendorID).Select("AVG(rating)").Scan(&avgRating)

	var reviewCount int64
	r.db.Model(&database.Review{}).Where("vendor_id = ?", vendorID).Count(&reviewCount)

	return r.db.Model(&database.Vendor{}).Where("id = ?", vendorID).Updates(map[string]interface{}{
		"rating":       avgRating,
		"review_count": reviewCount,
	}).Error
}

func (r *Repository) UpdateRiderRating(riderID uint) error {
	var avgRating float64
	r.db.Model(&database.Review{}).Where("rider_id = ?", riderID).Select("AVG(rating)").Scan(&avgRating)

	var reviewCount int64
	r.db.Model(&database.Review{}).Where("rider_id = ?", riderID).Count(&reviewCount)

	return r.db.Model(&database.Rider{}).Where("id = ?", riderID).Updates(map[string]interface{}{
		"rating":       avgRating,
		"review_count": reviewCount,
	}).Error
}
