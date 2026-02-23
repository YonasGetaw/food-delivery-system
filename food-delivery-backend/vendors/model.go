package vendors

type UpdateVendorRequest struct {
    BusinessName    string  `json:"business_name"`
    BusinessAddress string  `json:"business_address"`
    Phone           string  `json:"phone"`
    Description     string  `json:"description"`
    LogoURL         string  `json:"logo_url"`
    CoverImageURL   string  `json:"cover_image_url"`
    DeliveryRadius  float64 `json:"delivery_radius"`
    MinimumOrder    float64 `json:"minimum_order"`
}

type AddMenuItemRequest struct {
    Name            string   `json:"name" binding:"required"`
    Description     string   `json:"description"`
    Category        string   `json:"category" binding:"required"`
    Price           float64  `json:"price" binding:"required,min=0"`
    DiscountPrice   *float64 `json:"discount_price"`
    ImageURL        string   `json:"image_url"`
    PreparationTime int      `json:"preparation_time"`
    Calories        int      `json:"calories"`
    IsVegetarian    bool     `json:"is_vegetarian"`
    IsSpicy         bool     `json:"is_spicy"`
}

type UpdateMenuItemRequest struct {
    Name            string   `json:"name"`
    Description     string   `json:"description"`
    Category        string   `json:"category"`
    Price           float64  `json:"price"`
    DiscountPrice   *float64 `json:"discount_price"`
    ImageURL        string   `json:"image_url"`
    PreparationTime int      `json:"preparation_time"`
    Calories        int      `json:"calories"`
    IsVegetarian    bool     `json:"is_vegetarian"`
    IsSpicy         bool     `json:"is_spicy"`
    IsAvailable     *bool    `json:"is_available"`
}

type RejectOrderRequest struct {
    Reason string `json:"reason" binding:"required"`
}

type EarningsResponse struct {
    Period struct {
        StartDate string `json:"start_date"`
        EndDate   string `json:"end_date"`
    } `json:"period"`
    Summary struct {
        TotalOrders     int     `json:"total_orders"`
        TotalRevenue    float64 `json:"total_revenue"`
        TotalCommission float64 `json:"total_commission"`
        TotalEarnings   float64 `json:"total_earnings"`
        AverageOrderValue float64 `json:"average_order_value"`
    } `json:"summary"`
    DailyBreakdown []DailyEarnings `json:"daily_breakdown"`
    CurrentBalance float64         `json:"current_balance"`
}

type DailyEarnings struct {
    Date        string  `json:"date"`
    Orders      int     `json:"orders"`
    Revenue     float64 `json:"revenue"`
    Commission  float64 `json:"commission"`
    Earnings    float64 `json:"earnings"`
}