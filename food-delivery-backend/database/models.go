package database

import (
	"time"

	"gorm.io/gorm"
)

type Role string

const (
	RoleStudent Role = "student"
	RoleVendor  Role = "vendor"
	RoleRider   Role = "rider"
	RoleAdmin   Role = "admin"
)

type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusConfirmed OrderStatus = "confirmed"
	OrderStatusPreparing OrderStatus = "preparing"
	OrderStatusReady     OrderStatus = "ready"
	OrderStatusPickedUp  OrderStatus = "picked_up"
	OrderStatusDelivered OrderStatus = "delivered"
	OrderStatusCancelled OrderStatus = "cancelled"
	OrderStatusRejected  OrderStatus = "rejected"
)

type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusCompleted PaymentStatus = "completed"
	PaymentStatusFailed    PaymentStatus = "failed"
	PaymentStatusRefunded  PaymentStatus = "refunded"
)

type PaymentMethod string

const (
	PaymentMethodCash   PaymentMethod = "cash"
	PaymentMethodCard   PaymentMethod = "card"
	PaymentMethodWallet PaymentMethod = "wallet"
)

type User struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Email           string     `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash    string     `gorm:"not null" json:"-"`
	FirstName       string     `gorm:"not null" json:"first_name"`
	LastName        string     `gorm:"not null" json:"last_name"`
	ProfileImageURL string     `json:"profile_image_url"`
	Phone           string     `gorm:"uniqueIndex" json:"phone"`
	Role            Role       `gorm:"not null;index" json:"role"`
	IsActive        bool       `gorm:"default:true" json:"is_active"`
	LastLoginAt     *time.Time `json:"last_login_at"`

	// Role-specific relationships
	Student *Student `gorm:"foreignKey:UserID" json:"student,omitempty"`
	Vendor  *Vendor  `gorm:"foreignKey:UserID" json:"vendor,omitempty"`
	Rider   *Rider   `gorm:"foreignKey:UserID" json:"rider,omitempty"`
}

// Update the Student struct in database/models.go

type Student struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID           uint    `gorm:"uniqueIndex;not null" json:"user_id"`
	User             User    `json:"user"`
	StudentID        string  `gorm:"uniqueIndex;not null" json:"student_id"` // Add this field
	DefaultAddress   string  `json:"default_address"`
	DefaultLatitude  float64 `json:"default_latitude"`
	DefaultLongitude float64 `json:"default_longitude"`
	TotalOrders      int     `gorm:"default:0" json:"total_orders"`
	TotalSpent       float64 `gorm:"default:0" json:"total_spent"`

	Orders []Order `json:"orders,omitempty"`
}
type Vendor struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID          uint    `gorm:"uniqueIndex;not null" json:"user_id"`
	User            User    `json:"user"`
	BusinessName    string  `gorm:"not null" json:"business_name"`
	BusinessAddress string  `gorm:"not null" json:"business_address"`
	Latitude        float64 `json:"latitude"`
	Longitude       float64 `json:"longitude"`
	Phone           string  `json:"phone"`
	Description     string  `json:"description"`
	LogoURL         string  `json:"logo_url"`
	CoverImageURL   string  `json:"cover_image_url"`
	IsOpen          bool    `gorm:"default:false" json:"is_open"`
	CommissionRate  float64 `gorm:"default:0.15" json:"commission_rate"`
	DeliveryRadius  float64 `gorm:"default:5.0" json:"delivery_radius"`  // in km
	AveragePrepTime int     `gorm:"default:15" json:"average_prep_time"` // in minutes
	MinimumOrder    float64 `gorm:"default:0" json:"minimum_order"`
	TotalOrders     int     `gorm:"default:0" json:"total_orders"`
	TotalRevenue    float64 `gorm:"default:0" json:"total_revenue"`
	TotalEarnings   float64 `gorm:"default:0" json:"total_earnings"`
	CurrentBalance  float64 `gorm:"default:0" json:"current_balance"`
	Rating          float64 `gorm:"default:0" json:"rating"`
	ReviewCount     int     `gorm:"default:0" json:"review_count"`

	MenuItems []MenuItem `json:"menu_items,omitempty"`
	Orders    []Order    `json:"orders,omitempty"`
}

type Rider struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID             uint       `gorm:"uniqueIndex;not null" json:"user_id"`
	User               User       `json:"user"`
	VehicleNumber      string     `json:"vehicle_number"`
	VehicleType        string     `json:"vehicle_type"` // bike, scooter, car
	IsAvailable        bool       `gorm:"default:true;index" json:"is_available"`
	CurrentLatitude    float64    `json:"current_latitude"`
	CurrentLongitude   float64    `json:"current_longitude"`
	LastLocationUpdate *time.Time `json:"last_location_update"`
	TotalDeliveries    int        `gorm:"default:0" json:"total_deliveries"`
	TotalEarnings      float64    `gorm:"default:0" json:"total_earnings"`
	CurrentBalance     float64    `gorm:"default:0" json:"current_balance"`
	Rating             float64    `gorm:"default:0" json:"rating"`
	ReviewCount        int        `gorm:"default:0" json:"review_count"`

	Orders []Order `gorm:"foreignKey:AssignedRiderID" json:"orders,omitempty"`
}

type MenuItem struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	VendorID        uint     `gorm:"not null;index" json:"vendor_id"`
	Vendor          Vendor   `json:"vendor"`
	Name            string   `gorm:"not null" json:"name"`
	Description     string   `json:"description"`
	Category        string   `gorm:"index" json:"category"`
	Price           float64  `gorm:"not null" json:"price"`
	DiscountPrice   *float64 `json:"discount_price,omitempty"`
	ImageURL        string   `json:"image_url"`
	IsAvailable     bool     `gorm:"default:true;index" json:"is_available"`
	PreparationTime int      `json:"preparation_time"` // in minutes
	Calories        int      `json:"calories"`
	IsVegetarian    bool     `gorm:"default:false" json:"is_vegetarian"`
	IsSpicy         bool     `gorm:"default:false" json:"is_spicy"`
	SortOrder       int      `gorm:"default:0" json:"sort_order"`

	OrderItems []OrderItem `json:"order_items,omitempty"`
}
type Order struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	OrderNumber     string      `gorm:"uniqueIndex;not null" json:"order_number"`
	StudentID       uint        `gorm:"not null;index" json:"student_id"`
	Student         Student     `json:"student"`
	VendorID        uint        `gorm:"not null;index" json:"vendor_id"`
	Vendor          Vendor      `json:"vendor"`
	AssignedRiderID *uint       `gorm:"index" json:"assigned_rider_id"`
	AssignedRider   *Rider      `json:"assigned_rider,omitempty"`
	Status          OrderStatus `gorm:"not null;default:'pending';index" json:"status"`

	Subtotal         float64 `gorm:"not null" json:"subtotal"`
	DeliveryFee      float64 `gorm:"not null" json:"delivery_fee"`
	ServiceFee       float64 `gorm:"not null" json:"service_fee"`
	TotalAmount      float64 `gorm:"not null" json:"total_amount"`
	CommissionAmount float64 `gorm:"not null" json:"commission_amount"`
	VendorEarnings   float64 `gorm:"not null" json:"vendor_earnings"`
	RiderEarnings    float64 `gorm:"not null" json:"rider_earnings"`

	DeliveryAddress     string  `gorm:"not null" json:"delivery_address"`
	DeliveryLat         float64 `json:"delivery_lat"`
	DeliveryLng         float64 `json:"delivery_lng"`
	DeliveryBlock       string  `json:"delivery_block"`
	DeliveryDorm        string  `json:"delivery_dorm"`
	CustomerPhone       string  `json:"customer_phone"`
	CustomerIDNumber    string  `json:"customer_id_number"`
	SpecialInstructions string  `json:"special_instructions"`

	EstimatedDeliveryTime *time.Time `json:"estimated_delivery_time"`
	ConfirmedAt           *time.Time `json:"confirmed_at"`
	PreparedAt            *time.Time `json:"prepared_at"`
	ReadyAt               *time.Time `json:"ready_at"` // Add this missing field
	PickedUpAt            *time.Time `json:"picked_up_at"`
	DeliveredAt           *time.Time `json:"delivered_at"`
	CancelledAt           *time.Time `json:"cancelled_at"`
	CancellationReason    string     `json:"cancellation_reason,omitempty"`

	OrderItems []OrderItem `json:"order_items"`
	Payment    *Payment    `json:"payment,omitempty"`
}

type OrderItem struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	OrderID             uint     `gorm:"not null;index" json:"order_id"`
	Order               Order    `json:"-"`
	MenuItemID          uint     `gorm:"not null" json:"menu_item_id"`
	MenuItem            MenuItem `json:"menu_item"`
	Quantity            int      `gorm:"not null" json:"quantity"`
	UnitPrice           float64  `gorm:"not null" json:"unit_price"`
	Subtotal            float64  `gorm:"not null" json:"subtotal"`
	SpecialInstructions string   `json:"special_instructions"`
}

type Payment struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	OrderID       uint       `gorm:"not null;index" json:"order_id"`
	Order         Order      `json:"-"`
	Amount        float64    `gorm:"not null" json:"amount"`
	PaymentMethod string     `gorm:"not null" json:"payment_method"` // cash, card, wallet
	PaymentStatus string     `gorm:"not null;default:'pending'" json:"payment_status"`
	TransactionID string     `gorm:"uniqueIndex" json:"transaction_id"`
	PaidAt        *time.Time `json:"paid_at"`
}

type Transaction struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	UserID      uint    `gorm:"not null;index" json:"user_id"`
	User        User    `json:"user"`
	OrderID     *uint   `gorm:"index" json:"order_id"`
	Order       *Order  `json:"order,omitempty"`
	Amount      float64 `gorm:"not null" json:"amount"`
	Type        string  `gorm:"not null" json:"type"` // earning, withdrawal, refund
	Status      string  `gorm:"not null" json:"status"`
	Description string  `json:"description"`
	ReferenceID string  `gorm:"index" json:"reference_id"`
}

type Notification struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	UserID      uint       `gorm:"not null;index" json:"user_id"`
	User        User       `json:"-"`
	Title       string     `gorm:"not null" json:"title"`
	Message     string     `gorm:"not null" json:"message"`
	Type        string     `gorm:"index" json:"type"` // order_update, promotion, system
	ReferenceID string     `json:"reference_id"`      // order_id, etc.
	IsRead      bool       `gorm:"default:false;index" json:"is_read"`
	ReadAt      *time.Time `json:"read_at"`
}

type Review struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	OrderID     uint       `gorm:"uniqueIndex;not null" json:"order_id"`
	Order       Order      `json:"order"`
	StudentID   uint       `gorm:"not null" json:"student_id"`
	Student     Student    `json:"student"`
	VendorID    uint       `gorm:"not null" json:"vendor_id"`
	Vendor      Vendor     `json:"vendor"`
	RiderID     *uint      `json:"rider_id"`
	Rider       *Rider     `json:"rider,omitempty"`
	Rating      int        `gorm:"not null" json:"rating"` // 1-5
	Comment     string     `json:"comment"`
	VendorReply string     `json:"vendor_reply"`
	ReplyDate   *time.Time `json:"reply_date"`
}

// Add this after the User model
type Address struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID       uint    `gorm:"not null;index" json:"user_id"`
	User         User    `json:"-"`
	AddressLine1 string  `gorm:"not null" json:"address_line1"`
	AddressLine2 string  `json:"address_line2"`
	City         string  `gorm:"not null" json:"city"`
	State        string  `gorm:"not null" json:"state"`
	PostalCode   string  `gorm:"not null" json:"postal_code"`
	Country      string  `gorm:"not null" json:"country"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	IsDefault    bool    `gorm:"default:false" json:"is_default"`
	AddressType  string  `json:"address_type"` // home, work, other
}
