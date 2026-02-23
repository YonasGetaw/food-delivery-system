package orders

import (
	"food-delivery-backend/database"
	"time"
)

type CreateOrderRequest struct {
	VendorID            uint               `json:"vendor_id" binding:"required"`
	Items               []OrderItemRequest `json:"items" binding:"required,min=1,dive"`
	DeliveryAddress     string             `json:"delivery_address" binding:"required"`
	DeliveryLat         float64            `json:"delivery_lat"`
	DeliveryLng         float64            `json:"delivery_lng"`
	DeliveryBlock       string             `json:"delivery_block" binding:"required"`
	DeliveryDorm        string             `json:"delivery_dorm" binding:"required"`
	CustomerPhone       string             `json:"customer_phone" binding:"required"`
	CustomerIDNumber    string             `json:"customer_id_number" binding:"required"`
	SpecialInstructions string             `json:"special_instructions"`
	PaymentMethod       string             `json:"payment_method" binding:"required,oneof=cash card wallet"`
}

type OrderItemRequest struct {
	MenuItemID          uint   `json:"menu_item_id" binding:"required"`
	Quantity            int    `json:"quantity" binding:"required,min=1"`
	SpecialInstructions string `json:"special_instructions"`
}

type UpdateOrderStatusRequest struct {
	Status database.OrderStatus `json:"status" binding:"required"`
	Reason string               `json:"reason,omitempty"`
}

type CancelOrderRequest struct {
	Reason string `json:"reason" binding:"required"`
}

type RateOrderRequest struct {
	Rating  int    `json:"rating" binding:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

type OrderResponse struct {
	ID                    uint                 `json:"id"`
	OrderNumber           string               `json:"order_number"`
	Status                database.OrderStatus `json:"status"`
	Subtotal              float64              `json:"subtotal"`
	DeliveryFee           float64              `json:"delivery_fee"`
	ServiceFee            float64              `json:"service_fee"`
	TotalAmount           float64              `json:"total_amount"`
	DeliveryAddress       string               `json:"delivery_address"`
	DeliveryBlock         string               `json:"delivery_block,omitempty"`
	DeliveryDorm          string               `json:"delivery_dorm,omitempty"`
	CustomerPhone         string               `json:"customer_phone,omitempty"`
	CustomerIDNumber      string               `json:"customer_id_number,omitempty"`
	CreatedAt             time.Time            `json:"created_at"`
	EstimatedDeliveryTime *time.Time           `json:"estimated_delivery_time"`
	Items                 []OrderItemResponse  `json:"items"`
	Vendor                VendorInfo           `json:"vendor"`
	Rider                 *RiderInfo           `json:"rider,omitempty"`
	Payment               PaymentInfo          `json:"payment,omitempty"`
}

type OrderItemResponse struct {
	ID         uint    `json:"id"`
	MenuItemID uint    `json:"menu_item_id"`
	Name       string  `json:"name"`
	Quantity   int     `json:"quantity"`
	UnitPrice  float64 `json:"unit_price"`
	Subtotal   float64 `json:"subtotal"`
}

type VendorInfo struct {
	ID           uint   `json:"id"`
	BusinessName string `json:"business_name"`
	Phone        string `json:"phone"`
	Address      string `json:"address"`
}

type RiderInfo struct {
	ID            uint    `json:"id"`
	Name          string  `json:"name"`
	Phone         string  `json:"phone"`
	VehicleNumber string  `json:"vehicle_number"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
}

type PaymentInfo struct {
	Method string  `json:"method"`
	Status string  `json:"status"`
	Amount float64 `json:"amount"`
}

type TrackingInfo struct {
	OrderNumber       string               `json:"order_number"`
	Status            database.OrderStatus `json:"status"`
	EstimatedDelivery *time.Time           `json:"estimated_delivery"`
	DeliveryBlock     string               `json:"delivery_block,omitempty"`
	DeliveryDorm      string               `json:"delivery_dorm,omitempty"`
	CustomerPhone     string               `json:"customer_phone,omitempty"`
	CustomerIDNumber  string               `json:"customer_id_number,omitempty"`
	Vendor            struct {
		Name      string  `json:"name"`
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	} `json:"vendor"`
	Rider *struct {
		Name      string  `json:"name"`
		Phone     string  `json:"phone"`
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	} `json:"rider,omitempty"`
	Timeline []TrackingEvent `json:"timeline"`
}

type TrackingEvent struct {
	Status    database.OrderStatus `json:"status"`
	Timestamp time.Time            `json:"timestamp"`
	Location  string               `json:"location,omitempty"`
	Note      string               `json:"note,omitempty"`
}
