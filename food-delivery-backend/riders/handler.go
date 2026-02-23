package riders

import (
	"food-delivery-backend/pkg"
	"net/http"
	"strconv"

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

// GetRiderProfile returns rider profile
// @Summary Get rider profile
// @Tags Riders
// @Security BearerAuth
// @Produce json
// @Success 200 {object} pkg.Response{data=database.Rider}
// @Router /riders/profile [get]
func (h *Handler) GetRiderProfile(c *gin.Context) {
	riderID := c.GetUint("user_id")

	rider, err := h.service.GetRiderProfile(riderID)
	if err != nil {
		pkg.SendError(c, http.StatusNotFound, "Rider not found", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Rider profile retrieved", rider)
}

// UpdateRiderProfile updates rider profile
// @Summary Update rider profile
// @Tags Riders
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body UpdateRiderRequest true "Rider update data"
// @Success 200 {object} pkg.Response{data=database.Rider}
// @Router /riders/profile [put]
func (h *Handler) UpdateRiderProfile(c *gin.Context) {
	riderID := c.GetUint("user_id")

	var req UpdateRiderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	rider, err := h.service.UpdateRiderProfile(riderID, &req)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to update profile", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Profile updated successfully", rider)
}

// UpdateLocation updates rider's current location
// @Summary Update location
// @Tags Riders
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body UpdateLocationRequest true "Location data"
// @Success 200 {object} pkg.Response
// @Router /riders/location [post]
func (h *Handler) UpdateLocation(c *gin.Context) {
	riderID := c.GetUint("user_id")

	var req UpdateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	if err := h.service.UpdateLocation(riderID, req.Latitude, req.Longitude); err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to update location", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Location updated successfully", nil)
}

// ToggleAvailability toggles rider availability
// @Summary Toggle availability
// @Tags Riders
// @Security BearerAuth
// @Produce json
// @Success 200 {object} pkg.Response{data=map[string]bool}
// @Router /riders/toggle-availability [post]
func (h *Handler) ToggleAvailability(c *gin.Context) {
	riderID := c.GetUint("user_id")

	isAvailable, err := h.service.ToggleAvailability(riderID)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to toggle availability", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Availability updated", gin.H{"is_available": isAvailable})
}

// GetAssignedOrders returns rider's assigned orders
// @Summary Get assigned orders
// @Tags Riders
// @Security BearerAuth
// @Produce json
// @Param status query string false "Filter by status"
// @Success 200 {object} pkg.Response{data=[]database.Order}
// @Router /riders/orders [get]
func (h *Handler) GetAssignedOrders(c *gin.Context) {
	riderID := c.GetUint("user_id")
	status := c.Query("status")

	orders, err := h.service.GetAssignedOrders(riderID, status)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get orders", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Orders retrieved successfully", orders)
}

// GetAvailableOrders returns ready orders that are unassigned
// @Summary Get available orders
// @Tags Riders
// @Security BearerAuth
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} pkg.PaginatedResponse
// @Router /riders/available-orders [get]
func (h *Handler) GetAvailableOrders(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	orders, total, err := h.service.GetAvailableOrders(page, limit)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get available orders", err.Error())
		return
	}

	pkg.SendPaginated(c, http.StatusOK, "Available orders retrieved", orders, page, limit, total)
}

// ClaimOrder allows an available rider to claim an unassigned ready order
// @Summary Claim an order
// @Tags Riders
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Order ID"
// @Success 200 {object} pkg.Response
// @Router /riders/orders/{id}/claim [post]
func (h *Handler) ClaimOrder(c *gin.Context) {
	riderID := c.GetUint("user_id")
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
		return
	}

	if err := h.service.ClaimOrder(riderID, uint(orderID)); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to claim order", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Order claimed successfully", nil)
}

// GetOrder returns a specific order
// @Summary Get order details
// @Tags Riders
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Produce json
// @Success 200 {object} pkg.Response{data=database.Order}
// @Router /riders/orders/{id} [get]
func (h *Handler) GetOrder(c *gin.Context) {
	riderID := c.GetUint("user_id")
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
		return
	}

	order, err := h.service.GetOrder(riderID, uint(orderID))
	if err != nil {
		pkg.SendError(c, http.StatusNotFound, "Order not found", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Order retrieved successfully", order)
}

// PickUpOrder marks order as picked up
// @Summary Mark order as picked up
// @Tags Riders
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Success 200 {object} pkg.Response
// @Router /riders/orders/{id}/pickup [post]
func (h *Handler) PickUpOrder(c *gin.Context) {
	riderID := c.GetUint("user_id")
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
		return
	}

	if err := h.service.PickUpOrder(riderID, uint(orderID)); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to mark as picked up", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Order marked as picked up", nil)
}

// DeliverOrder marks order as delivered
// @Summary Mark order as delivered
// @Tags Riders
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Success 200 {object} pkg.Response
// @Router /riders/orders/{id}/deliver [post]
func (h *Handler) DeliverOrder(c *gin.Context) {
	riderID := c.GetUint("user_id")
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
		return
	}

	if err := h.service.DeliverOrder(riderID, uint(orderID)); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to mark as delivered", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Order marked as delivered", nil)
}

// GetEarnings returns rider earnings
// @Summary Get earnings
// @Tags Riders
// @Security BearerAuth
// @Produce json
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Success 200 {object} pkg.Response{data=RiderEarningsResponse}
// @Router /riders/earnings [get]
func (h *Handler) GetEarnings(c *gin.Context) {
	riderID := c.GetUint("user_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	earnings, err := h.service.GetEarnings(riderID, startDate, endDate)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get earnings", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Earnings retrieved successfully", earnings)
}

// GetDeliveryHistory returns delivery history
// @Summary Get delivery history
// @Tags Riders
// @Security BearerAuth
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} pkg.PaginatedResponse
// @Router /riders/deliveries [get]
func (h *Handler) GetDeliveryHistory(c *gin.Context) {
	riderID := c.GetUint("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	deliveries, total, err := h.service.GetDeliveryHistory(riderID, page, limit)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get delivery history", err.Error())
		return
	}

	pkg.SendPaginated(c, http.StatusOK, "Delivery history retrieved", deliveries, page, limit, total)
}
