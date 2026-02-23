package auth

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
    "food-delivery-backend/pkg"
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

// Register handles student registration
// @Summary Register a new student
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "Registration details"
// @Success 201 {object} pkg.Response{data=AuthResponse}
// @Failure 400 {object} pkg.Response
// @Router /auth/register [post]
func (h *Handler) Register(c *gin.Context) {
    var req RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        h.logger.Warn("Invalid registration request", zap.Error(err))
        pkg.SendError(c, http.StatusBadRequest, "Invalid request format", err.Error())
        return
    }

    // Validate password strength
    if !pkg.IsValidPassword(req.Password) {
        pkg.SendError(c, http.StatusBadRequest, "Password must be at least 6 characters long", nil)
        return
    }

    resp, err := h.service.Register(&req)
    if err != nil {
        h.logger.Error("Registration failed", zap.Error(err))
        pkg.SendError(c, http.StatusBadRequest, "Registration failed", err.Error())
        return
    }

    pkg.SendSuccess(c, http.StatusCreated, "Registration successful", resp)
}

// Login handles user login
// @Summary Login user
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login credentials"
// @Success 200 {object} pkg.Response{data=AuthResponse}
// @Failure 401 {object} pkg.Response
// @Router /auth/login [post]
func (h *Handler) Login(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        h.logger.Warn("Invalid login request", zap.Error(err))
        pkg.SendError(c, http.StatusBadRequest, "Invalid request format", err.Error())
        return
    }

    resp, err := h.service.Login(&req)
    if err != nil {
        h.logger.Warn("Login failed", zap.String("phone", req.Phone), zap.Error(err))
        pkg.SendError(c, http.StatusUnauthorized, "Login failed", err.Error())
        return
    }

    pkg.SendSuccess(c, http.StatusOK, "Login successful", resp)
}

// RefreshToken handles token refresh
// @Summary Refresh JWT token
// @Tags Auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} pkg.Response{data=AuthResponse}
// @Failure 401 {object} pkg.Response
// @Router /auth/refresh [post]
func (h *Handler) RefreshToken(c *gin.Context) {
    userID := c.GetUint("user_id")
    email := c.GetString("user_email")
    role := c.GetString("user_role")

    token, err := h.service.RefreshToken(userID, email, role)
    if err != nil {
        h.logger.Error("Token refresh failed", zap.Error(err))
        pkg.SendError(c, http.StatusInternalServerError, "Failed to refresh token", nil)
        return
    }

    pkg.SendSuccess(c, http.StatusOK, "Token refreshed successfully", gin.H{
        "token": token,
    })
}

// ChangePassword handles password change
// @Summary Change user password
// @Tags Auth
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body ChangePasswordRequest true "Password change details"
// @Success 200 {object} pkg.Response
// @Failure 400 {object} pkg.Response
// @Router /auth/change-password [post]
func (h *Handler) ChangePassword(c *gin.Context) {
    var req ChangePasswordRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
        return
    }

    userID := c.GetUint("user_id")

    if err := h.service.ChangePassword(userID, &req); err != nil {
        pkg.SendError(c, http.StatusBadRequest, "Failed to change password", err.Error())
        return
    }

    pkg.SendSuccess(c, http.StatusOK, "Password changed successfully", nil)
}

// Logout handles user logout
// @Summary Logout user
// @Tags Auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} pkg.Response
// @Router /auth/logout [post]
func (h *Handler) Logout(c *gin.Context) {
    // In a real implementation, you might want to blacklist the token
    pkg.SendSuccess(c, http.StatusOK, "Logout successful", nil)
}