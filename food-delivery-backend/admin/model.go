package admin

type CreateVendorRequest struct {
	Email           string  `json:"email" binding:"omitempty,email"`
	Password        string  `json:"password" binding:"required,min=6"`
	FirstName       string  `json:"first_name" binding:"required"`
	LastName        string  `json:"last_name" binding:"required"`
	Phone           string  `json:"phone" binding:"required"`
	BusinessName    string  `json:"business_name" binding:"required"`
	BusinessAddress string  `json:"business_address" binding:"required"`
	Latitude        float64 `json:"latitude"`
	Longitude       float64 `json:"longitude"`
	CommissionRate  float64 `json:"commission_rate"`
}

type CreateRiderRequest struct {
	Email         string `json:"email" binding:"omitempty,email"`
	Password      string `json:"password" binding:"required,min=6"`
	FirstName     string `json:"first_name" binding:"required"`
	LastName      string `json:"last_name" binding:"required"`
	Phone         string `json:"phone" binding:"required"`
	VehicleNumber string `json:"vehicle_number" binding:"required"`
	VehicleType   string `json:"vehicle_type" binding:"required"`
}

type AssignRiderRequest struct {
	RiderID uint `json:"rider_id" binding:"required"`
}

type OrderFilters struct {
	Status    string
	VendorID  uint
	RiderID   uint
	StartDate string
	EndDate   string
}

type RevenueReport struct {
	Period struct {
		StartDate string `json:"start_date"`
		EndDate   string `json:"end_date"`
	} `json:"period"`
	Summary struct {
		TotalOrders       int     `json:"total_orders"`
		TotalRevenue      float64 `json:"total_revenue"`
		AverageOrderValue float64 `json:"average_order_value"`
		TotalCommission   float64 `json:"total_commission"`
		PlatformFee       float64 `json:"platform_fee"`
		DeliveryFees      float64 `json:"delivery_fees"`
	} `json:"summary"`
	ByVendor []VendorRevenue `json:"by_vendor"`
	ByDay    []DailyRevenue  `json:"daily_breakdown"`
}

type DashboardResponse struct {
	Totals struct {
		Users   int64 `json:"users"`
		Vendors int64 `json:"vendors"`
		Riders  int64 `json:"riders"`
		Orders  int64 `json:"orders"`
	} `json:"totals"`
	OrdersByStatus []OrdersByStatus `json:"orders_by_status"`
	Daily          []DailyOrders    `json:"daily"`
	RecentOrders   []RecentOrder    `json:"recent_orders"`
}

type OrdersByStatus struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}

type DailyOrders struct {
	Date    string  `json:"date"`
	Orders  int64   `json:"orders"`
	Revenue float64 `json:"revenue"`
}

type RecentOrder struct {
	ID          uint    `json:"id"`
	OrderNumber string  `json:"order_number"`
	Status      string  `json:"status"`
	TotalAmount float64 `json:"total_amount"`
	CreatedAt   string  `json:"created_at"`
	VendorName  string  `json:"vendor_name"`
}

type VendorRevenue struct {
	VendorID     uint    `json:"vendor_id"`
	BusinessName string  `json:"business_name"`
	Orders       int     `json:"orders"`
	Revenue      float64 `json:"revenue"`
	Commission   float64 `json:"commission"`
	Earnings     float64 `json:"earnings"`
}

type DailyRevenue struct {
	Date    string  `json:"date"`
	Orders  int     `json:"orders"`
	Revenue float64 `json:"revenue"`
}

type VendorPerformance struct {
	VendorID          uint    `json:"vendor_id"`
	BusinessName      string  `json:"business_name"`
	TotalOrders       int     `json:"total_orders"`
	TotalRevenue      float64 `json:"total_revenue"`
	AverageOrderValue float64 `json:"average_order_value"`
	Rating            float64 `json:"rating"`
	ReviewCount       int     `json:"review_count"`
	AcceptanceRate    float64 `json:"acceptance_rate"`
	CompletionRate    float64 `json:"completion_rate"`
	AvgPrepTime       float64 `json:"avg_prep_time"`
}

type RiderPerformance struct {
	RiderID         uint    `json:"rider_id"`
	Name            string  `json:"name"`
	TotalDeliveries int     `json:"total_deliveries"`
	TotalEarnings   float64 `json:"total_earnings"`
	Rating          float64 `json:"rating"`
	ReviewCount     int     `json:"review_count"`
	AcceptanceRate  float64 `json:"acceptance_rate"`
	AvgDeliveryTime float64 `json:"avg_delivery_time"`
}
