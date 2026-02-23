package vendors

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

// GetVendorProfile returns vendor profile
// @Summary Get vendor profile
// @Tags Vendors
// @Security BearerAuth
// @Produce json
// @Success 200 {object} pkg.Response{data=database.Vendor}
// @Router /vendors/profile [get]
func (h *Handler) GetVendorProfile(c *gin.Context) {
	vendorID := c.GetUint("user_id")

	vendor, err := h.service.GetVendorProfile(vendorID)
	if err != nil {
		pkg.SendError(c, http.StatusNotFound, "Vendor not found", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Vendor profile retrieved", vendor)
}

// UpdateVendorProfile updates vendor profile
// @Summary Update vendor profile
// @Tags Vendors
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body UpdateVendorRequest true "Vendor update data"
// @Success 200 {object} pkg.Response{data=database.Vendor}
// @Router /vendors/profile [put]
func (h *Handler) UpdateVendorProfile(c *gin.Context) {
	vendorID := c.GetUint("user_id")

	var req UpdateVendorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	vendor, err := h.service.UpdateVendorProfile(vendorID, &req)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to update profile", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Profile updated successfully", vendor)
}

// ToggleOpenStatus toggles vendor open/closed status
// @Summary Toggle open status
// @Tags Vendors
// @Security BearerAuth
// @Produce json
// @Success 200 {object} pkg.Response{data=map[string]bool}
// @Router /vendors/toggle-status [post]
func (h *Handler) ToggleOpenStatus(c *gin.Context) {
	vendorID := c.GetUint("user_id")

	isOpen, err := h.service.ToggleOpenStatus(vendorID)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to toggle status", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Status updated", gin.H{"is_open": isOpen})
}

// GetMenuItems returns vendor's menu items
// @Summary Get menu items
// @Tags Vendors
// @Security BearerAuth
// @Produce json
// @Success 200 {object} pkg.Response{data=[]database.MenuItem}
// @Router /vendors/menu [get]
func (h *Handler) GetMenuItems(c *gin.Context) {
	vendorID := c.GetUint("user_id")

	items, err := h.service.GetMenuItems(vendorID)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get menu items", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Menu items retrieved", items)
}

// AddMenuItem adds a new menu item
// @Summary Add menu item
// @Tags Vendors
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body AddMenuItemRequest true "Menu item data"
// @Success 201 {object} pkg.Response{data=database.MenuItem}
// @Router /vendors/menu [post]
func (h *Handler) AddMenuItem(c *gin.Context) {
	vendorID := c.GetUint("user_id")

	var req AddMenuItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	item, err := h.service.AddMenuItem(vendorID, &req)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to add menu item", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusCreated, "Menu item added successfully", item)
}

// UpdateMenuItem updates a menu item
// @Summary Update menu item
// @Tags Vendors
// @Security BearerAuth
// @Param id path int true "Menu Item ID"
// @Accept json
// @Produce json
// @Param request body UpdateMenuItemRequest true "Menu item update data"
// @Success 200 {object} pkg.Response{data=database.MenuItem}
// @Router /vendors/menu/{id} [put]
func (h *Handler) UpdateMenuItem(c *gin.Context) {
	vendorID := c.GetUint("user_id")
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid item ID", nil)
		return
	}

	var req UpdateMenuItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	item, err := h.service.UpdateMenuItem(vendorID, uint(itemID), &req)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to update menu item", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Menu item updated successfully", item)
}

// DeleteMenuItem deletes a menu item
// @Summary Delete menu item
// @Tags Vendors
// @Security BearerAuth
// @Param id path int true "Menu Item ID"
// @Success 200 {object} pkg.Response
// @Router /vendors/menu/{id} [delete]
func (h *Handler) DeleteMenuItem(c *gin.Context) {
	vendorID := c.GetUint("user_id")
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid item ID", nil)
		return
	}

	if err := h.service.DeleteMenuItem(vendorID, uint(itemID)); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to delete menu item", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Menu item deleted successfully", nil)
}

// ToggleMenuItemAvailability toggles menu item availability
// @Summary Toggle menu item availability
// @Tags Vendors
// @Security BearerAuth
// @Param id path int true "Menu Item ID"
// @Success 200 {object} pkg.Response{data=map[string]bool}
// @Router /vendors/menu/{id}/toggle [post]
func (h *Handler) ToggleMenuItemAvailability(c *gin.Context) {
	vendorID := c.GetUint("user_id")
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid item ID", nil)
		return
	}

	isAvailable, err := h.service.ToggleMenuItemAvailability(vendorID, uint(itemID))
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to toggle availability", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Availability toggled", gin.H{"is_available": isAvailable})
}

// GetOrders returns vendor's orders
// @Summary Get vendor orders
// @Tags Vendors
// @Security BearerAuth
// @Produce json
// @Param status query string false "Filter by status"
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} pkg.PaginatedResponse
// @Router /vendors/orders [get]
func (h *Handler) GetOrders(c *gin.Context) {
	vendorID := c.GetUint("user_id")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	orders, total, err := h.service.GetOrders(vendorID, status, page, limit)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get orders", err.Error())
		return
	}

	pkg.SendPaginated(c, http.StatusOK, "Orders retrieved successfully", orders, page, limit, total)
}

// GetOrder returns a specific order
// @Summary Get order details
// @Tags Vendors
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Produce json
// @Success 200 {object} pkg.Response{data=database.Order}
// @Router /vendors/orders/{id} [get]
func (h *Handler) GetOrder(c *gin.Context) {
	vendorID := c.GetUint("user_id")
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
		return
	}

	order, err := h.service.GetOrder(vendorID, uint(orderID))
	if err != nil {
		pkg.SendError(c, http.StatusNotFound, "Order not found", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Order retrieved successfully", order)
}

// AcceptOrder accepts an order
// @Summary Accept order
// @Tags Vendors
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Success 200 {object} pkg.Response
// @Router /vendors/orders/{id}/accept [post]
func (h *Handler) AcceptOrder(c *gin.Context) {
	vendorID := c.GetUint("user_id")
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
		return
	}

	if err := h.service.AcceptOrder(vendorID, uint(orderID)); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to accept order", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Order accepted successfully", nil)
}

// RejectOrder rejects an order
// @Summary Reject order
// @Tags Vendors
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Accept json
// @Produce json
// @Param request body RejectOrderRequest true "Rejection reason"
// @Success 200 {object} pkg.Response
// @Router /vendors/orders/{id}/reject [post]
func (h *Handler) RejectOrder(c *gin.Context) {
	vendorID := c.GetUint("user_id")
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
		return
	}

	var req RejectOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	if err := h.service.RejectOrder(vendorID, uint(orderID), req.Reason); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to reject order", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Order rejected successfully", nil)
}

// MarkOrderReady marks order as ready
// @Summary Mark order as ready
// @Tags Vendors
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Success 200 {object} pkg.Response
// @Router /vendors/orders/{id}/ready [post]
func (h *Handler) MarkOrderReady(c *gin.Context) {
	vendorID := c.GetUint("user_id")
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
		return
	}

	if err := h.service.MarkOrderReady(vendorID, uint(orderID)); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Failed to mark order as ready", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Order marked as ready", nil)
}

// GetEarnings returns vendor earnings
// @Summary Get earnings
// @Tags Vendors
// @Security BearerAuth
// @Produce json
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Success 200 {object} pkg.Response{data=EarningsResponse}
// @Router /vendors/earnings [get]
func (h *Handler) GetEarnings(c *gin.Context) {
	vendorID := c.GetUint("user_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	earnings, err := h.service.GetEarnings(vendorID, startDate, endDate)
	if err != nil {
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get earnings", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Earnings retrieved successfully", earnings)
}

// ================ PUBLIC METHODS ================

// GetPublicVendors returns all active vendors for public viewing
// @Summary Get all active vendors
// @Tags Public
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} pkg.PaginatedResponse
// @Router /public/vendors [get]
func (h *Handler) GetPublicVendors(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	vendors, total, err := h.service.GetPublicVendors(page, limit)
	if err != nil {
		h.logger.Error("Failed to get public vendors", zap.Error(err))
		pkg.SendError(c, http.StatusInternalServerError, "Failed to get vendors", err.Error())
		return
	}

	pkg.SendPaginated(c, http.StatusOK, "Vendors retrieved successfully", vendors, page, limit, total)
}

// GetPublicMenu returns a vendor's menu for public viewing
// @Summary Get vendor menu
// @Tags Public
// @Param id path int true "Vendor ID"
// @Produce json
// @Success 200 {object} pkg.Response{data=[]database.MenuItem}
// @Router /public/vendors/{id}/menu [get]
func (h *Handler) GetPublicMenu(c *gin.Context) {
	vendorID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid vendor ID", nil)
		return
	}

	items, err := h.service.GetPublicMenu(uint(vendorID))
	if err != nil {
		pkg.SendError(c, http.StatusNotFound, "Failed to get menu", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Menu retrieved successfully", items)
}

// GetPublicMenuItem returns a single menu item for public viewing
// @Summary Get menu item
// @Tags Public
// @Param id path int true "Menu Item ID"
// @Produce json
// @Success 200 {object} pkg.Response{data=database.MenuItem}
// @Router /public/menu/{id} [get]
func (h *Handler) GetPublicMenuItem(c *gin.Context) {
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid menu item ID", nil)
		return
	}

	item, err := h.service.GetPublicMenuItem(uint(itemID))
	if err != nil {
		pkg.SendError(c, http.StatusNotFound, "Menu item not found", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Menu item retrieved successfully", item)
}

// Add this method to vendors/handler.go

// UpdateOrderStatus updates order status (for vendor to start preparing)
// @Summary Update order status
// @Tags Vendors
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Accept json
// @Produce json
// @Param request body map[string]string true "Status update"
// @Success 200 {object} pkg.Response
// @Router /vendors/orders/{id}/status [post]
func (h *Handler) UpdateOrderStatus(c *gin.Context) {
	vendorID := c.GetUint("user_id")
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	h.logger.Info("Vendor UpdateOrderStatus request", zap.Uint("vendor_user_id", vendorID), zap.Uint64("order_id", orderID), zap.String("status", req.Status))

	if err := h.service.UpdateOrderStatus(vendorID, uint(orderID), req.Status); err != nil {
		h.logger.Error("Failed to update order status via service", zap.Error(err), zap.Uint("vendor_user_id", vendorID), zap.Uint64("order_id", orderID))
		pkg.SendError(c, http.StatusBadRequest, "Failed to update order status", err.Error())
		return
	}

	pkg.SendSuccess(c, http.StatusOK, "Order status updated successfully", nil)
}
