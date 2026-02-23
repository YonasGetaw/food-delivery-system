package admin

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

// CreateVendor creates a new vendor
// @Summary Create vendor
// @Tags Admin
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body CreateVendorRequest true "Vendor details"
// @Success 201 {object} pkg.Response{data=database.Vendor}
// @Router /admin/vendors [post]
func (h *Handler) CreateVendor(c *gin.Context) {
	var req CreateVendorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	vendor, err := h.service.CreateVendor(&req)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to create vendor", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusCreated, "Vendor created successfully", vendor)
}

// CreateRider creates a new rider
// @Summary Create rider
// @Tags Admin
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body CreateRiderRequest true "Rider details"
// @Success 201 {object} pkg.Response{data=database.Rider}
// @Router /admin/riders [post]
func (h *Handler) CreateRider(c *gin.Context) {
	var req CreateRiderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	rider, err := h.service.CreateRider(&req)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to create rider", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusCreated, "Rider created successfully", rider)
}

// GetUsers returns all users
// @Summary Get all users
// @Tags Admin
// @Security BearerAuth
// @Produce json
// @Param role query string false "Filter by role"
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} pkg.PaginatedResponse
// @Router /admin/users [get]
func (h *Handler) GetUsers(c *gin.Context) {
	role := c.Query("role")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	users, total, err := h.service.GetUsers(role, page, limit)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get users", err.Error())
		return
	}

	pkg.SendPaginated(c, http.StatusOK, "Users retrieved successfully", users, page, limit, total)
}

// GetUser returns user details
// @Summary Get user details
// @Tags Admin
// @Security BearerAuth
// @Param id path int true "User ID"
// @Produce json
// @Success 200 {object} pkg.Response{data=database.User}
// @Router /admin/users/{id} [get]
func (h *Handler) GetUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid user ID", nil)
		return
	}

	user, err := h.service.GetUser(uint(userID))
	if err != nil {
		pkg.SendError(c, http.StatusNotFound, "User not found", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "User retrieved successfully", user)
}

// ToggleUserStatus activates/deactivates a user
// @Summary Toggle user status
// @Tags Admin
// @Security BearerAuth
// @Param id path int true "User ID"
// @Success 200 {object} pkg.Response{data=map[string]bool}
// @Router /admin/users/{id}/toggle [post]
func (h *Handler) ToggleUserStatus(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid user ID", nil)
		return
	}

	isActive, err := h.service.ToggleUserStatus(uint(userID))
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to toggle user status", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "User status updated", gin.H{"is_active": isActive})
}

// GetVendors returns all vendors
// @Summary Get all vendors
// @Tags Admin
// @Security BearerAuth
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} pkg.PaginatedResponse
// @Router /admin/vendors [get]
func (h *Handler) GetVendors(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	vendors, total, err := h.service.GetVendors(page, limit)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get vendors", err.Error())
		return
	}

	pkg.SendPaginated(c, http.StatusOK, "Vendors retrieved successfully", vendors, page, limit, total)
}

// GetRiders returns all riders
// @Summary Get all riders
// @Tags Admin
// @Security BearerAuth
// @Produce json
// @Param available query bool false "Filter by availability"
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} pkg.PaginatedResponse
// @Router /admin/riders [get]
func (h *Handler) GetRiders(c *gin.Context) {
	available := c.Query("available")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	var availablePtr *bool
	if available != "" {
		isAvailable := available == "true"
		availablePtr = &isAvailable
	}

	riders, total, err := h.service.GetRiders(availablePtr, page, limit)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get riders", err.Error())
		return
	}

	pkg.SendPaginated(c, http.StatusOK, "Riders retrieved successfully", riders, page, limit, total)
}

// GetOrders returns all orders
// @Summary Get all orders
// @Tags Admin
// @Security BearerAuth
// @Produce json
// @Param status query string false "Filter by status"
// @Param vendor_id query int false "Filter by vendor"
// @Param rider_id query int false "Filter by rider"
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} pkg.PaginatedResponse
// @Router /admin/orders [get]
func (h *Handler) GetOrders(c *gin.Context) {
	var filters OrderFilters
	filters.Status = c.Query("status")

	vendorID, _ := strconv.ParseUint(c.Query("vendor_id"), 10, 32)
	filters.VendorID = uint(vendorID)

	riderID, _ := strconv.ParseUint(c.Query("rider_id"), 10, 32)
	filters.RiderID = uint(riderID)

	filters.StartDate = c.Query("start_date")
	filters.EndDate = c.Query("end_date")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	orders, total, err := h.service.GetOrders(&filters, page, limit)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get orders", err.Error())
		return
	}

	pkg.SendPaginated(c, http.StatusOK, "Orders retrieved successfully", orders, page, limit, total)
}

// AssignRider assigns a rider to an order
// @Summary Assign rider to order
// @Tags Admin
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Accept json
// @Produce json
// @Param request body AssignRiderRequest true "Rider assignment"
// @Success 200 {object} pkg.Response
// @Router /admin/orders/{id}/assign-rider [post]
func (h *Handler) AssignRider(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
		return
	}

	var req AssignRiderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	if err := h.service.AssignRider(uint(orderID), req.RiderID); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to assign rider", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Rider assigned successfully", nil)
}

// GetRevenueReport returns revenue report
// @Summary Get revenue report
// @Tags Admin
// @Security BearerAuth
// @Produce json
// @Param start_date query string true "Start date (YYYY-MM-DD)"
// @Param end_date query string true "End date (YYYY-MM-DD)"
// @Success 200 {object} pkg.Response{data=RevenueReport}
// @Router /admin/reports/revenue [get]
func (h *Handler) GetRevenueReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		pkg.SendError(c, http.StatusBadRequest, "Start date and end date are required", nil)
		return
	}

	report, err := h.service.GetRevenueReport(startDate, endDate)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to generate report", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Revenue report generated", report)
}

// GetVendorPerformance returns vendor performance report
// @Summary Get vendor performance
// @Tags Admin
// @Security BearerAuth
// @Param vendor_id path int true "Vendor ID"
// @Produce json
// @Success 200 {object} pkg.Response{data=VendorPerformance}
// @Router /admin/reports/vendors/{vendor_id} [get]
func (h *Handler) GetVendorPerformance(c *gin.Context) {
	vendorID, err := strconv.ParseUint(c.Param("vendor_id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid vendor ID", nil)
		return
	}

	performance, err := h.service.GetVendorPerformance(uint(vendorID))
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get vendor performance", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Vendor performance retrieved", performance)
}

// GetRiderPerformance returns rider performance report
// @Summary Get rider performance
// @Tags Admin
// @Security BearerAuth
// @Param rider_id path int true "Rider ID"
// @Produce json
// @Success 200 {object} pkg.Response{data=RiderPerformance}
// @Router /admin/reports/riders/{rider_id} [get]
func (h *Handler) GetRiderPerformance(c *gin.Context) {
	riderID, err := strconv.ParseUint(c.Param("rider_id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid rider ID", nil)
		return
	}

	performance, err := h.service.GetRiderPerformance(uint(riderID))
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get rider performance", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Rider performance retrieved", performance)
}

// GetOrder returns order details
// @Summary Get order details
// @Tags Admin
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Produce json
// @Success 200 {object} pkg.Response{data=database.Order}
// @Router /admin/orders/{id} [get]
func (h *Handler) GetOrder(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
		return
	}

	order, err := h.service.GetOrder(uint(orderID))
	if err != nil {
		pkg.SendError(c, http.StatusNotFound, "Order not found", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Order retrieved successfully", order)
}

// GetDashboard returns admin dashboard analytics
// @Summary Get admin dashboard analytics
// @Tags Admin
// @Security BearerAuth
// @Produce json
// @Param days query int false "Number of days for daily chart"
// @Success 200 {object} pkg.Response{data=DashboardResponse}
// @Router /admin/dashboard [get]
func (h *Handler) GetDashboard(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "14"))
	resp, err := h.service.GetDashboard(days)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to load dashboard", err.Error())
		return
	}
	pkg.SendSuccess(c, http.StatusOK, "Dashboard retrieved successfully", resp)
}
