package auth

import (
	"errors"
	"food-delivery-backend/config"
	"food-delivery-backend/database"
	"food-delivery-backend/pkg"
	"time"

	"go.uber.org/zap"
)

type Service struct {
	repo     *Repository
	cfg      *config.Config
	logger   *zap.Logger
	jwtMaker *pkg.JWTMaker
}

func NewService(repo *Repository, cfg *config.Config, logger *zap.Logger) *Service {
	return &Service{
		repo:     repo,
		cfg:      cfg,
		logger:   logger,
		jwtMaker: pkg.NewJWTMaker(cfg.JWTSecret),
	}
}

func (s *Service) Register(req *RegisterRequest) (*AuthResponse, error) {
	// Check if user exists by phone
	exists, err := s.repo.UserExistsByPhone(req.Phone)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("user with this phone number already exists")
	}

	// Check if student_id already exists
	var existingStudent database.Student
	err = s.repo.db.Where("student_id = ?", req.StudentID).First(&existingStudent).Error
	if err == nil {
		return nil, errors.New("student ID already registered")
	}

	// Hash password
	hashedPassword, err := pkg.HashPassword(req.Password)
	if err != nil {
		s.logger.Error("Failed to hash password", zap.Error(err))
		return nil, errors.New("failed to process registration")
	}

	// Generate a dummy email from phone (or make email optional)
	email := req.Phone + "@student.local"

	// Create user within transaction
	tx := s.repo.db.Begin()

	user := &database.User{
		Email:        email,
		PasswordHash: hashedPassword,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        req.Phone,
		Role:         database.RoleStudent,
		IsActive:     true,
	}

	if err := tx.Create(user).Error; err != nil {
		tx.Rollback()
		s.logger.Error("Failed to create user", zap.Error(err))
		return nil, errors.New("failed to create user")
	}

	// Create student profile with student_id
	student := &database.Student{
		UserID:    user.ID,
		StudentID: req.StudentID,
	}
	if err := tx.Create(student).Error; err != nil {
		tx.Rollback()
		s.logger.Error("Failed to create student profile", zap.Error(err))
		return nil, errors.New("failed to create student profile")
	}

	if err := tx.Commit().Error; err != nil {
		return nil, errors.New("failed to complete registration")
	}

	// Generate token
	token, err := s.jwtMaker.GenerateToken(
		user.ID,
		user.Email,
		string(user.Role),
		time.Duration(s.cfg.JWTExpiry)*time.Hour,
	)
	if err != nil {
		s.logger.Error("Failed to generate token", zap.Error(err))
		return nil, errors.New("failed to generate authentication token")
	}

	return &AuthResponse{
		Token:     token,
		UserID:    user.ID,
		Email:     user.Email,
		Phone:     user.Phone,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Role:      string(user.Role),
	}, nil
}

// ... rest of the methods remain the same ...
func (s *Service) Login(req *LoginRequest) (*AuthResponse, error) {
	// Get user
	user, err := s.repo.GetUserByPhone(req.Phone)
	if err != nil {
		return nil, errors.New("phone number or password invalid")
	}
	if user == nil {
		return nil, errors.New("phone number or password invalid")
	}

	// Check if user is active
	if !user.IsActive {
		return nil, errors.New("account is deactivated. Please contact support")
	}

	// Verify password
	if err := pkg.CheckPassword(req.Password, user.PasswordHash); err != nil {
		return nil, errors.New("phone number or password invalid")
	}

	// Update last login
	s.repo.UpdateLastLogin(user.ID)

	// Generate token
	token, err := s.jwtMaker.GenerateToken(
		user.ID,
		user.Email,
		string(user.Role),
		time.Duration(s.cfg.JWTExpiry)*time.Hour,
	)
	if err != nil {
		s.logger.Error("Failed to generate token", zap.Error(err))
		return nil, errors.New("failed to generate authentication token")
	}

	return &AuthResponse{
		Token:     token,
		UserID:    user.ID,
		Email:     user.Email,
		Phone:     user.Phone,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Role:      string(user.Role),
	}, nil
}

func (s *Service) RefreshToken(userID uint, email, role string) (string, error) {
	token, err := s.jwtMaker.GenerateToken(
		userID,
		email,
		role,
		time.Duration(s.cfg.JWTExpiry)*time.Hour,
	)
	if err != nil {
		s.logger.Error("Failed to refresh token", zap.Error(err))
		return "", errors.New("failed to refresh token")
	}
	return token, nil
}

func (s *Service) ChangePassword(userID uint, req *ChangePasswordRequest) error {
	// Get user
	user, err := s.repo.GetUserByID(userID)
	if err != nil || user == nil {
		return errors.New("user not found")
	}

	// Verify old password
	if err := pkg.CheckPassword(req.OldPassword, user.PasswordHash); err != nil {
		return errors.New("current password is incorrect")
	}

	// Hash new password
	hashedPassword, err := pkg.HashPassword(req.NewPassword)
	if err != nil {
		s.logger.Error("Failed to hash new password", zap.Error(err))
		return errors.New("failed to process password change")
	}

	// Update password
	return s.repo.UpdatePassword(userID, hashedPassword)
}
