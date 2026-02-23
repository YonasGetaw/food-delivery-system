package vendors

import (
    "time"
    "food-delivery-backend/database"
    "gorm.io/gorm"
)

type Repository struct {
    db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
    return &Repository{db: db}
}

func (r *Repository) GetVendorByUserID(userID uint) (*database.Vendor, error) {
    var vendor database.Vendor
    err := r.db.Preload("User").Where("user_id = ?", userID).First(&vendor).Error
    return &vendor, err
}

func (r *Repository) UpdateVendor(vendor *database.Vendor) error {
    return r.db.Save(vendor).Error
}

func (r *Repository) GetMenuItems(vendorID uint) ([]database.MenuItem, error) {
    var items []database.MenuItem
    err := r.db.Where("vendor_id = ?", vendorID).Order("sort_order, category, name").Find(&items).Error
    return items, err
}

func (r *Repository) CreateMenuItem(item *database.MenuItem) error {
    return r.db.Create(item).Error
}

func (r *Repository) GetMenuItemByID(itemID uint) (*database.MenuItem, error) {
    var item database.MenuItem
    err := r.db.First(&item, itemID).Error
    return &item, err
}

func (r *Repository) UpdateMenuItem(item *database.MenuItem) error {
    return r.db.Save(item).Error
}

func (r *Repository) DeleteMenuItem(itemID uint) error {
    return r.db.Delete(&database.MenuItem{}, itemID).Error
}

func (r *Repository) GetOrders(vendorID uint, status string, offset, limit int) ([]database.Order, int64, error) {
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

func (r *Repository) UpdateOrderStatus(orderID uint, status database.OrderStatus, timestamp *time.Time) error {
    updates := map[string]interface{}{
        "status": status,
    }
    if timestamp != nil {
        switch status {
        case database.OrderStatusConfirmed:
            updates["confirmed_at"] = timestamp
        case database.OrderStatusPreparing:
            updates["prepared_at"] = timestamp
        case database.OrderStatusReady:
            updates["ready_at"] = timestamp
        }
    }
    return r.db.Model(&database.Order{}).Where("id = ?", orderID).Updates(updates).Error
}

func (r *Repository) GetEarnings(vendorID uint, startDate, endDate time.Time) ([]database.Order, error) {
    var orders []database.Order
    err := r.db.Where("vendor_id = ? AND status = ? AND created_at BETWEEN ? AND ?",
        vendorID, database.OrderStatusDelivered, startDate, endDate).
        Order("created_at ASC").
        Find(&orders).Error
    return orders, err
}

func (r *Repository) GetVendorBalance(vendorID uint) (float64, error) {
    var vendor database.Vendor
    err := r.db.Select("current_balance").First(&vendor, vendorID).Error
    return vendor.CurrentBalance, err
}

// GetPublicVendors returns all active vendors for public viewing
func (r *Repository) GetPublicVendors(offset, limit int) ([]database.Vendor, int64, error) {
    var vendors []database.Vendor
    var total int64

    query := r.db.Model(&database.Vendor{}).
        Where("is_open = ?", true).
        Preload("User")

    query.Count(&total)

    err := query.Offset(offset).
        Limit(limit).
        Order("rating DESC, total_orders DESC").
        Find(&vendors).Error

    return vendors, total, err
}

// GetVendorByID gets a vendor by ID
func (r *Repository) GetVendorByID(vendorID uint) (*database.Vendor, error) {
    var vendor database.Vendor
    err := r.db.Preload("User").First(&vendor, vendorID).Error
    return &vendor, err
}

// GetPublicMenuItems returns all available menu items for a vendor
func (r *Repository) GetPublicMenuItems(vendorID uint) ([]database.MenuItem, error) {
    var items []database.MenuItem
    err := r.db.Where("vendor_id = ? AND is_available = ?", vendorID, true).
        Order("category, sort_order, name").
        Find(&items).Error
    return items, err
}

// GetPublicMenuItemByID returns a single menu item by ID (only if available)
func (r *Repository) GetPublicMenuItemByID(itemID uint) (*database.MenuItem, error) {
    var item database.MenuItem
    err := r.db.Where("id = ? AND is_available = ?", itemID, true).
        Preload("Vendor").
        First(&item).Error
    return &item, err
}

// Add this method if it doesn't exist

func (r *Repository) GetOrderByID(orderID uint) (*database.Order, error) {
    var order database.Order
    err := r.db.Preload("Vendor").Preload("Student").Preload("OrderItems.MenuItem").
        Where("id = ?", orderID).First(&order).Error
    if err != nil {
        return nil, err
    }
    return &order, nil
}

// Add this method if it doesn't exist
