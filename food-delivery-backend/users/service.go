package users

import (
	"errors"
	"food-delivery-backend/database"

	"go.uber.org/zap"
)

type Service struct {
	repo   *Repository
	logger *zap.Logger
}

func NewService(repo *Repository, logger *zap.Logger) *Service {
	return &Service{
		repo:   repo,
		logger: logger,
	}
}

func (s *Service) GetProfile(userID uint) (*database.User, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		s.logger.Error("Failed to get user profile", zap.Error(err))
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (s *Service) UpdateProfile(userID uint, req *UpdateProfileRequest) (*database.User, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	user.FirstName = req.FirstName
	user.LastName = req.LastName
	user.Phone = req.Phone

	if err := s.repo.UpdateUser(user); err != nil {
		s.logger.Error("Failed to update user", zap.Error(err))
		return nil, errors.New("failed to update profile")
	}

	return user, nil
}

func (s *Service) GetAddresses(userID uint) ([]database.Address, error) {
	return s.repo.GetAddresses(userID)
}

func (s *Service) AddAddress(userID uint, req *AddAddressRequest) (*database.Address, error) {
	// If this is the first address or marked as default, clear other defaults
	if req.IsDefault {
		s.repo.ClearDefaultAddresses(userID)
	}

	address := &database.Address{
		UserID:       userID,
		AddressLine1: req.AddressLine1,
		AddressLine2: req.AddressLine2,
		City:         req.City,
		State:        req.State,
		PostalCode:   req.PostalCode,
		Country:      req.Country,
		Latitude:     req.Latitude,
		Longitude:    req.Longitude,
		IsDefault:    req.IsDefault,
		AddressType:  req.AddressType,
	}

	if err := s.repo.CreateAddress(address); err != nil {
		s.logger.Error("Failed to create address", zap.Error(err))
		return nil, errors.New("failed to add address")
	}

	return address, nil
}

func (s *Service) UpdateAddress(userID uint, addressID uint, req *UpdateAddressRequest) (*database.Address, error) {
	address, err := s.repo.GetAddressByID(addressID)
	if err != nil {
		return nil, errors.New("address not found")
	}

	if address.UserID != userID {
		return nil, errors.New("unauthorized to update this address")
	}

	// If setting as default, clear other defaults
	if req.IsDefault && !address.IsDefault {
		s.repo.ClearDefaultAddresses(userID)
	}

	// Update fields
	if req.AddressLine1 != "" {
		address.AddressLine1 = req.AddressLine1
	}
	if req.AddressLine2 != "" {
		address.AddressLine2 = req.AddressLine2
	}
	if req.City != "" {
		address.City = req.City
	}
	if req.State != "" {
		address.State = req.State
	}
	if req.PostalCode != "" {
		address.PostalCode = req.PostalCode
	}
	if req.Country != "" {
		address.Country = req.Country
	}
	if req.Latitude != 0 {
		address.Latitude = req.Latitude
	}
	if req.Longitude != 0 {
		address.Longitude = req.Longitude
	}
	address.IsDefault = req.IsDefault
	if req.AddressType != "" {
		address.AddressType = req.AddressType
	}

	if err := s.repo.UpdateAddress(address); err != nil {
		s.logger.Error("Failed to update address", zap.Error(err))
		return nil, errors.New("failed to update address")
	}

	return address, nil
}

func (s *Service) DeleteAddress(userID uint, addressID uint) error {
	address, err := s.repo.GetAddressByID(addressID)
	if err != nil {
		return errors.New("address not found")
	}

	if address.UserID != userID {
		return errors.New("unauthorized to delete this address")
	}

	return s.repo.DeleteAddress(addressID)
}

func (s *Service) GetOrderHistory(userID uint, page, limit int) ([]database.Order, int64, error) {
	offset := (page - 1) * limit
	return s.repo.GetOrderHistory(userID, offset, limit)
}

func (s *Service) UpdateProfileImage(userID uint, imageURL string) (*database.User, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	user.ProfileImageURL = imageURL
	if err := s.repo.UpdateUser(user); err != nil {
		s.logger.Error("Failed to update profile image", zap.Error(err))
		return nil, errors.New("failed to update profile image")
	}

	return user, nil
}
