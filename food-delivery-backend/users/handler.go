package users

import (
	"fmt"
	"food-delivery-backend/pkg"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type Handler struct {
	service *Service
	logger  *zap.Logger
}

func NewHandler(service *Service, logger *zap.Logger) *Handler {
	return &Handler{
		service: service,
		logger:  logger,
	}
}

// GetProfile returns the user's profile
// @Summary Get user profile
// @Tags Users
// @Security BearerAuth
// @Produce json
// @Success 200 {object} pkg.Response{data=database.User}
// @Failure 401 {object} pkg.Response
// @Router /users/profile [get]
func (h *Handler) GetProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	profile, err := h.service.GetProfile(userID)
	if err != nil {
		h.logger.Error("Failed to get profile", zap.Error(err))
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get profile", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Profile retrieved successfully", profile)
}

// UpdateProfile updates the user's profile
// @Summary Update user profile
// @Tags Users
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body UpdateProfileRequest true "Profile update data"
// @Success 200 {object} pkg.Response{data=database.User}
// @Failure 400 {object} pkg.Response
// @Router /users/profile [put]
func (h *Handler) UpdateProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	user, err := h.service.UpdateProfile(userID, &req)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to update profile", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Profile updated successfully", user)
}

// GetAddresses returns user's addresses
// @Summary Get user addresses
// @Tags Users
// @Security BearerAuth
// @Produce json
// @Success 200 {object} pkg.Response{data=[]database.Address}
// @Router /users/addresses [get]
func (h *Handler) GetAddresses(c *gin.Context) {
	userID := c.GetUint("user_id")

	addresses, err := h.service.GetAddresses(userID)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get addresses", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Addresses retrieved successfully", addresses)
}

// AddAddress adds a new address
// @Summary Add new address
// @Tags Users
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body AddAddressRequest true "Address data"
// @Success 201 {object} pkg.Response{data=database.Address}
// @Router /users/addresses [post]
func (h *Handler) AddAddress(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req AddAddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	address, err := h.service.AddAddress(userID, &req)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to add address", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusCreated, "Address added successfully", address)
}

// UpdateAddress updates an address
// @Summary Update address
// @Tags Users
// @Security BearerAuth
// @Param id path int true "Address ID"
// @Accept json
// @Produce json
// @Success 200 {object} pkg.Response{data=database.Address}
// @Router /users/addresses/{id} [put]
func (h *Handler) UpdateAddress(c *gin.Context) {
	userID := c.GetUint("user_id")
	addressID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid address ID", nil)
		return
	}

	var req UpdateAddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	address, err := h.service.UpdateAddress(userID, uint(addressID), &req)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to update address", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Address updated successfully", address)
}

// DeleteAddress deletes an address
// @Summary Delete address
// @Tags Users
// @Security BearerAuth
// @Param id path int true "Address ID"
// @Success 200 {object} pkg.Response
// @Router /users/addresses/{id} [delete]
func (h *Handler) DeleteAddress(c *gin.Context) {
	userID := c.GetUint("user_id")
	addressID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid address ID", nil)
		return
	}

	if err := h.service.DeleteAddress(userID, uint(addressID)); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to delete address", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Address deleted successfully", nil)
}

// GetOrderHistory returns user's order history
// @Summary Get order history
// @Tags Users
// @Security BearerAuth
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} pkg.PaginatedResponse
// @Router /users/orders [get]
func (h *Handler) GetOrderHistory(c *gin.Context) {
	userID := c.GetUint("user_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	orders, total, err := h.service.GetOrderHistory(userID, page, limit)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get order history", err.Error())
		return
	}

	pkg.SendPaginated(c, http.StatusOK, "Order history retrieved successfully", orders, page, limit, total)
}

// UploadProfileImage uploads a profile image and stores its URL on the user.
// @Summary Upload profile image
// @Tags Users
// @Security BearerAuth
// @Accept multipart/form-data
// @Produce json
// @Param image formData file true "Profile image"
// @Success 200 {object} pkg.Response{data=map[string]string}
// @Router /users/profile-image [post]
func (h *Handler) UploadProfileImage(c *gin.Context) {
	userID := c.GetUint("user_id")

	file, err := c.FormFile("image")
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "No image file provided", err.Error())
		return
	}

	if file.Size > 5*1024*1024 {
		pkg.SendError(c, http.StatusBadRequest, "File too large", "Maximum size is 5MB")
		return
	}

	ext := filepath.Ext(file.Filename)
	allowedExts := []string{".jpg", ".jpeg", ".png", ".gif"}
	valid := false
	for _, allowed := range allowedExts {
		if ext == allowed {
			valid = true
			break
		}
	}
	if !valid {
		pkg.SendError(c, http.StatusBadRequest, "Invalid file type", "Only JPG, PNG, GIF allowed")
		return
	}

	uploadDir := "./uploads/profile-images"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		h.logger.Error("Failed to create upload directory", zap.Error(err))
		pkg.SendError(c, http.StatusInternalServerError, "Failed to save file", nil)
		return
	}

	filename := fmt.Sprintf("%d_%d%s", userID, time.Now().Unix(), ext)
	dstPath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, dstPath); err != nil {
		h.logger.Error("Failed to save file", zap.Error(err))
		pkg.SendError(c, http.StatusInternalServerError, "Failed to save file", nil)
		return
	}

	imageURL := fmt.Sprintf("/uploads/profile-images/%s", filename)
	if _, err := h.service.UpdateProfileImage(userID, imageURL); err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to update profile image", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Profile image uploaded successfully", gin.H{
		"image_url": imageURL,
	})
}
