package users

import (
    "food-delivery-backend/database"
    "gorm.io/gorm"
)

type Repository struct {
    db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
    return &Repository{db: db}
}

func (r *Repository) GetUserByID(userID uint) (*database.User, error) {
    var user database.User
    err := r.db.Preload("Student").First(&user, userID).Error
    return &user, err
}

func (r *Repository) UpdateUser(user *database.User) error {
    return r.db.Save(user).Error
}

func (r *Repository) GetAddresses(userID uint) ([]database.Address, error) {
    var addresses []database.Address
    err := r.db.Where("user_id = ?", userID).Order("is_default DESC, created_at DESC").Find(&addresses).Error
    return addresses, err
}

func (r *Repository) CreateAddress(address *database.Address) error {
    return r.db.Create(address).Error
}

func (r *Repository) UpdateAddress(address *database.Address) error {
    return r.db.Save(address).Error
}

func (r *Repository) DeleteAddress(addressID uint) error {
    return r.db.Delete(&database.Address{}, addressID).Error
}

func (r *Repository) GetAddressByID(addressID uint) (*database.Address, error) {
    var address database.Address
    err := r.db.First(&address, addressID).Error
    return &address, err
}

func (r *Repository) ClearDefaultAddresses(userID uint) error {
    return r.db.Model(&database.Address{}).Where("user_id = ?", userID).Update("is_default", false).Error
}

func (r *Repository) GetOrderHistory(userID uint, offset, limit int) ([]database.Order, int64, error) {
    var orders []database.Order
    var total int64

    r.db.Model(&database.Order{}).Where("student_id = ?", userID).Count(&total)

    err := r.db.Where("student_id = ?", userID).
        Preload("OrderItems.MenuItem").
        Preload("Vendor").
        Preload("AssignedRider.User").
        Order("created_at DESC").
        Offset(offset).
        Limit(limit).
        Find(&orders).Error

    return orders, total, err
}