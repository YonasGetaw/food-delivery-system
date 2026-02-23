package orders

import (
    "net/http"
    "strconv"
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

// CreateOrder creates a new order
// @Summary Create new order
// @Tags Orders
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body CreateOrderRequest true "Order details"
// @Success 201 {object} pkg.Response{data=database.Order}
// @Failure 400 {object} pkg.Response
// @Router /orders [post]
func (h *Handler) CreateOrder(c *gin.Context) {
    studentID := c.GetUint("user_id")

    var req CreateOrderRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
        return
    }

    // Validate request
    if len(req.Items) == 0 {
        pkg.SendError(c, http.StatusBadRequest, "Order must contain at least one item", nil)
        return
    }

    order, err := h.service.CreateOrder(studentID, &req)
    if err != nil {
        h.logger.Error("Failed to create order", zap.Error(err))
        pkg.SendError(c, http.StatusBadRequest, "Failed to create order", err.Error())
        return
    }

    pkg.SendSuccess(c, http.StatusCreated, "Order created successfully", order)
}

// GetOrder returns order details
// @Summary Get order details
// @Tags Orders
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Produce json
// @Success 200 {object} pkg.Response{data=database.Order}
// @Failure 404 {object} pkg.Response
// @Router /orders/{id} [get]
func (h *Handler) GetOrder(c *gin.Context) {
    userID := c.GetUint("user_id")
    userRole := c.GetString("user_role")
    orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
        return
    }

    order, err := h.service.GetOrder(userID, userRole, uint(orderID))
    if err != nil {
        pkg.SendError(c, http.StatusNotFound, "Order not found", err.Error())
        return
    }

    pkg.SendSuccess(c, http.StatusOK, "Order retrieved successfully", order)
}

// GetStudentOrders returns student's orders
// @Summary Get student orders
// @Tags Orders
// @Security BearerAuth
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} pkg.PaginatedResponse
// @Router /orders/student [get]
func (h *Handler) GetStudentOrders(c *gin.Context) {
    studentID := c.GetUint("user_id")
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

    orders, total, err := h.service.GetStudentOrders(studentID, page, limit)
    if err != nil {
        pkg.SendError(c, http.StatusInternalServerError, "Failed to get orders", err.Error())
        return
    }

    pkg.SendPaginated(c, http.StatusOK, "Orders retrieved successfully", orders, page, limit, total)
}

// GetVendorOrders returns vendor's orders
// @Summary Get vendor orders
// @Tags Orders
// @Security BearerAuth
// @Produce json
// @Param status query string false "Filter by status"
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} pkg.PaginatedResponse
// @Router /orders/vendor [get]
func (h *Handler) GetVendorOrders(c *gin.Context) {
    vendorID := c.GetUint("user_id")
    status := c.Query("status")
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

    orders, total, err := h.service.GetVendorOrders(vendorID, status, page, limit)
    if err != nil {
        pkg.SendError(c, http.StatusInternalServerError, "Failed to get orders", err.Error())
        return
    }

    pkg.SendPaginated(c, http.StatusOK, "Orders retrieved successfully", orders, page, limit, total)
}

// GetRiderOrders returns rider's orders
// @Summary Get rider orders
// @Tags Orders
// @Security BearerAuth
// @Produce json
// @Param status query string false "Filter by status"
// @Success 200 {object} pkg.Response{data=[]database.Order}
// @Router /orders/rider [get]
func (h *Handler) GetRiderOrders(c *gin.Context) {
    riderID := c.GetUint("user_id")
    status := c.Query("status")

    orders, err := h.service.GetRiderOrders(riderID, status)
    if err != nil {
        pkg.SendError(c, http.StatusInternalServerError, "Failed to get orders", err.Error())
        return
    }

    pkg.SendSuccess(c, http.StatusOK, "Orders retrieved successfully", orders)
}

// UpdateOrderStatus updates order status
// @Summary Update order status
// @Tags Orders
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Accept json
// @Produce json
// @Param request body UpdateOrderStatusRequest true "Status update"
// @Success 200 {object} pkg.Response
// @Failure 400 {object} pkg.Response
// @Router /orders/{id}/status [put]
func (h *Handler) UpdateOrderStatus(c *gin.Context) {
    userID := c.GetUint("user_id")
    userRole := c.GetString("user_role")
    orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
        return
    }

    var req UpdateOrderStatusRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
        return
    }

    if err := h.service.UpdateOrderStatus(userID, userRole, uint(orderID), req.Status, req.Reason); err != nil {
        pkg.SendError(c, http.StatusBadRequest, "Failed to update order status", err.Error())
        return
    }

    pkg.SendSuccess(c, http.StatusOK, "Order status updated successfully", nil)
}

// CancelOrder cancels an order
// @Summary Cancel order
// @Tags Orders
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Accept json
// @Produce json
// @Param request body CancelOrderRequest true "Cancellation reason"
// @Success 200 {object} pkg.Response
// @Router /orders/{id}/cancel [post]
func (h *Handler) CancelOrder(c *gin.Context) {
    userID := c.GetUint("user_id")
    userRole := c.GetString("user_role")
    orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
        return
    }

    var req CancelOrderRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
        return
    }

    if err := h.service.CancelOrder(userID, userRole, uint(orderID), req.Reason); err != nil {
        pkg.SendError(c, http.StatusBadRequest, "Failed to cancel order", err.Error())
        return
    }

    pkg.SendSuccess(c, http.StatusOK, "Order cancelled successfully", nil)
}

// TrackOrder returns real-time order tracking info
// @Summary Track order
// @Tags Orders
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Produce json
// @Success 200 {object} pkg.Response{data=TrackingInfo}
// @Router /orders/{id}/track [get]
func (h *Handler) TrackOrder(c *gin.Context) {
    userID := c.GetUint("user_id")
    orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
        return
    }

    tracking, err := h.service.TrackOrder(userID, uint(orderID))
    if err != nil {
        pkg.SendError(c, http.StatusNotFound, "Order not found", err.Error())
        return
    }

    pkg.SendSuccess(c, http.StatusOK, "Tracking info retrieved", tracking)
}

// RateOrder rates a delivered order
// @Summary Rate order
// @Tags Orders
// @Security BearerAuth
// @Param id path int true "Order ID"
// @Accept json
// @Produce json
// @Param request body RateOrderRequest true "Rating details"
// @Success 200 {object} pkg.Response
// @Router /orders/{id}/rate [post]
func (h *Handler) RateOrder(c *gin.Context) {
    studentID := c.GetUint("user_id")
    orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        pkg.SendError(c, http.StatusBadRequest, "Invalid order ID", nil)
        return
    }

    var req RateOrderRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        pkg.SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
        return
    }

    if err := h.service.RateOrder(studentID, uint(orderID), &req); err != nil {
        pkg.SendError(c, http.StatusBadRequest, "Failed to rate order", err.Error())
        return
    }

    pkg.SendSuccess(c, http.StatusOK, "Order rated successfully", nil)
}