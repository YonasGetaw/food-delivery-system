package riders

type UpdateRiderRequest struct {
    VehicleNumber string `json:"vehicle_number"`
    VehicleType   string `json:"vehicle_type"`
    Phone         string `json:"phone"`
}

type UpdateLocationRequest struct {
    Latitude  float64 `json:"latitude" binding:"required"`
    Longitude float64 `json:"longitude" binding:"required"`
}

type RiderEarningsResponse struct {
    Period struct {
        StartDate string `json:"start_date"`
        EndDate   string `json:"end_date"`
    } `json:"period"`
    Summary struct {
        TotalDeliveries int     `json:"total_deliveries"`
        TotalEarnings   float64 `json:"total_earnings"`
        AveragePerDelivery float64 `json:"average_per_delivery"`
    } `json:"summary"`
    DailyBreakdown []DailyEarnings `json:"daily_breakdown"`
    CurrentBalance float64         `json:"current_balance"`
}

type DailyEarnings struct {
    Date       string  `json:"date"`
    Deliveries int     `json:"deliveries"`
    Earnings   float64 `json:"earnings"`
}