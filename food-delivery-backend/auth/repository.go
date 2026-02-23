package auth

import (
    "errors"
    "food-delivery-backend/database"
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

func (r *Repository) GetUserByEmail(email string) (*database.User, error) {
    var user database.User
    err := r.db.Where("email = ?", email).First(&user).Error
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, nil
    }
    return &user, err
}

func (r *Repository) GetUserByID(id uint) (*database.User, error) {
    var user database.User
    err := r.db.First(&user, id).Error
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, nil
    }
    return &user, err
}

func (r *Repository) CreateStudent(student *database.Student) error {
    return r.db.Create(student).Error
}

func (r *Repository) UpdateLastLogin(userID uint) error {
    return r.db.Model(&database.User{}).Where("id = ?", userID).
        Update("last_login_at", gorm.Expr("NOW()")).Error
}

func (r *Repository) UpdatePassword(userID uint, hashedPassword string) error {
    return r.db.Model(&database.User{}).Where("id = ?", userID).
        Update("password_hash", hashedPassword).Error
}

func (r *Repository) UserExists(email string) (bool, error) {
    var count int64
    err := r.db.Model(&database.User{}).Where("email = ?", email).Count(&count).Error
    return count > 0, err
}

// Add this method to auth/repository.go

func (r *Repository) GetUserByPhone(phone string) (*database.User, error) {
    var user database.User
    err := r.db.Where("phone = ?", phone).First(&user).Error
    if err != nil {
        return nil, err
    }
    return &user, nil
}

func (r *Repository) UserExistsByPhone(phone string) (bool, error) {
    var count int64
    err := r.db.Model(&database.User{}).Where("phone = ?", phone).Count(&count).Error
    return count > 0, err
}