package admin

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

func (r *Repository) CreateUser(user *database.User) error {
    return r.db.Create(user).Error
}

func (r *Repository) CreateVendor(vendor *database.Vendor) error {
    return r.db.Create(vendor).Error
}

func (r *Repository) CreateRider(rider *database.Rider) error {
    return r.db.Create(rider).Error
}

func (r *Repository) GetUsers(role string, offset, limit int) ([]database.User, int64, error) {
    var users []database.User
    var total int64

    query := r.db.Model(&database.User{})
    if role != "" {
        query = query.Where("role = ?", role)
    }
    query.Count(&total)

    err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&users).Error
    return users, total, err
}

func (r *Repository) GetUserByID(userID uint) (*database.User, error) {
    var user database.User
    err := r.db.Preload("Student").Preload("Vendor").Preload("Rider").First(&user, userID).Error
    return &user, err
}

func (r *Repository) UpdateUser(user *database.User) error {
    return r.db.Save(user).Error
}

func (r *Repository) GetVendors(offset, limit int) ([]database.Vendor, int64, error) {
    var vendors []database.Vendor
    var total int64

    r.db.Model(&database.Vendor{}).Count(&total)

    err := r.db.Preload("User").Offset(offset).Limit(limit).Order("created_at DESC").Find(&vendors).Error
    return vendors, total, err
}

func (r *Repository) GetRiders(available *bool, offset, limit int) ([]database.Rider, int64, error) {
    var riders []database.Rider
    var total int64

    query := r.db.Model(&database.Rider{}).Preload("User")
    if available != nil {
        query = query.Where("is_available = ?", *available)
    }
    query.Count(&total)

    err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&riders).Error
    return riders, total, err
}

func (r *Repository) GetOrders(filters *OrderFilters, offset, limit int) ([]database.Order, int64, error) {
    var orders []database.Order
    var total int64

    query := r.db.Model(&database.Order{}).
        Preload("Student.User").
        Preload("Vendor.User").
        Preload("AssignedRider.User").
        Preload("OrderItems.MenuItem")

    if filters.Status != "" {
        query = query.Where("status = ?", filters.Status)
    }
    if filters.VendorID != 0 {
        query = query.Where("vendor_id = ?", filters.VendorID)
    }
    if filters.RiderID != 0 {
        query = query.Where("assigned_rider_id = ?", filters.RiderID)
    }
    if filters.StartDate != "" && filters.EndDate != "" {
        query = query.Where("created_at BETWEEN ? AND ?", filters.StartDate, filters.EndDate)
    }

    query.Count(&total)
    err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&orders).Error
    return orders, total, err
}

func (r *Repository) AssignRider(orderID, riderID uint) error {
    return r.db.Model(&database.Order{}).Where("id = ?", orderID).Updates(map[string]interface{}{
        "assigned_rider_id": riderID,
        "status": database.OrderStatusConfirmed,
        "confirmed_at": time.Now(),
    }).Error
}

func (r *Repository) GetRevenueReport(startDate, endDate time.Time) ([]database.Order, error) {
    var orders []database.Order
    err := r.db.Where("status = ? AND created_at BETWEEN ? AND ?", 
        database.OrderStatusDelivered, startDate, endDate).
        Preload("Vendor.User").
        Order("created_at ASC").
        Find(&orders).Error
    return orders, err
}

func (r *Repository) GetVendorStats(vendorID uint) (*VendorPerformance, error) {
    var stats VendorPerformance
    stats.VendorID = vendorID

    // Get vendor details
    var vendor database.Vendor
    if err := r.db.Preload("User").First(&vendor, vendorID).Error; err != nil {
        return nil, err
    }
    stats.BusinessName = vendor.BusinessName
    stats.Rating = vendor.Rating
    stats.ReviewCount = vendor.ReviewCount

    // Get order stats
    var totalOrders int64
    var totalRevenue float64
    r.db.Model(&database.Order{}).Where("vendor_id = ? AND status = ?", vendorID, database.OrderStatusDelivered).
        Count(&totalOrders).Select("SUM(subtotal)").Scan(&totalRevenue)
    stats.TotalOrders = int(totalOrders)
    stats.TotalRevenue = totalRevenue
    if totalOrders > 0 {
        stats.AverageOrderValue = totalRevenue / float64(totalOrders)
    }

    // Get acceptance rate
    var accepted, total int64
    r.db.Model(&database.Order{}).Where("vendor_id = ?", vendorID).Count(&total)
    r.db.Model(&database.Order{}).Where("vendor_id = ? AND status != ?", vendorID, database.OrderStatusRejected).Count(&accepted)
    if total > 0 {
        stats.AcceptanceRate = float64(accepted) / float64(total) * 100
    }

    // Get completion rate
    var completed int64
    r.db.Model(&database.Order{}).Where("vendor_id = ? AND status = ?", vendorID, database.OrderStatusDelivered).Count(&completed)
    if total > 0 {
        stats.CompletionRate = float64(completed) / float64(total) * 100
    }

    // Get average prep time
    r.db.Raw(`SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (prepared_at - confirmed_at))/60), 0) 
        FROM orders WHERE vendor_id = ? AND confirmed_at IS NOT NULL AND prepared_at IS NOT NULL`, vendorID).Scan(&stats.AvgPrepTime)

    return &stats, nil
}

func (r *Repository) GetRiderStats(riderID uint) (*RiderPerformance, error) {
    var stats RiderPerformance
    stats.RiderID = riderID

    // Get rider details
    var rider database.Rider
    if err := r.db.Preload("User").First(&rider, riderID).Error; err != nil {
        return nil, err
    }
    stats.Name = rider.User.FirstName + " " + rider.User.LastName
    stats.Rating = rider.Rating
    stats.ReviewCount = rider.ReviewCount
    stats.TotalDeliveries = rider.TotalDeliveries
    stats.TotalEarnings = rider.TotalEarnings

    // Get acceptance rate
    var accepted, total int64
    r.db.Model(&database.Order{}).Where("assigned_rider_id = ?", riderID).Count(&total)
    r.db.Model(&database.Order{}).Where("assigned_rider_id = ? AND status != ?", riderID, database.OrderStatusRejected).Count(&accepted)
    if total > 0 {
        stats.AcceptanceRate = float64(accepted) / float64(total) * 100
    }

    // Get average delivery time
    r.db.Raw(`SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (delivered_at - picked_up_at))/60), 0) 
        FROM orders WHERE assigned_rider_id = ? AND picked_up_at IS NOT NULL AND delivered_at IS NOT NULL`, riderID).Scan(&stats.AvgDeliveryTime)

    return &stats, nil
}

func (r *Repository) GetOrderByID(orderID uint) (*database.Order, error) {
    var order database.Order
    err := r.db.Model(&database.Order{}).
        Preload("Student.User").
        Preload("Vendor.User").
        Preload("AssignedRider.User").
        Preload("OrderItems.MenuItem").
        Preload("Payment").
        First(&order, orderID).Error
    if err != nil {
        return nil, err
    }
    return &order, nil
}