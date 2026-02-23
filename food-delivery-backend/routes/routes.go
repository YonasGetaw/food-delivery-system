package routes

import (
	"food-delivery-backend/admin"
	"food-delivery-backend/auth"
	"food-delivery-backend/middleware"
	"food-delivery-backend/notifications"
	"food-delivery-backend/orders"
	"food-delivery-backend/pkg"
	"food-delivery-backend/riders"
	"food-delivery-backend/users"
	"food-delivery-backend/vendors"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func SetupRoutes(
	router *gin.Engine,
	authHandler *auth.Handler,
	usersHandler *users.Handler,
	vendorsHandler *vendors.Handler,
	ridersHandler *riders.Handler,
	ordersHandler *orders.Handler,
	adminHandler *admin.Handler,
	notificationsHandler *notifications.Handler,
	wsHub *notifications.Hub,
	jwtMaker *pkg.JWTMaker,
	logger *zap.Logger,
) {
	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1 group
	v1 := router.Group("/api/v1")
	{
		// Public routes
		public := v1.Group("/auth")
		{
			public.POST("/register", authHandler.Register)
			public.POST("/login", authHandler.Login)
			public.POST("/refresh", authHandler.RefreshToken)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(jwtMaker))
		{
			// WebSocket connection
			protected.GET("/ws", wsHub.HandleWebSocket)

			// Notifications
			nRoutes := protected.Group("/notifications")
			{
				nRoutes.GET("", notificationsHandler.ListMyNotifications)
				nRoutes.GET("/unread-count", notificationsHandler.GetMyUnreadCount)
				nRoutes.POST("/:id/read", notificationsHandler.MarkNotificationRead)
				nRoutes.POST("/read-all", notificationsHandler.MarkAllNotificationsRead)
			}

			// Auth routes
			protected.GET("/auth/me", usersHandler.GetProfile)
			protected.POST("/auth/change-password", authHandler.ChangePassword)
			protected.POST("/auth/logout", authHandler.Logout)

			// User routes (accessible by all authenticated users)
			userRoutes := protected.Group("/users")
			{
				userRoutes.GET("/profile", usersHandler.GetProfile)
				userRoutes.PUT("/profile", usersHandler.UpdateProfile)
				userRoutes.POST("/profile-image", usersHandler.UploadProfileImage)
				userRoutes.GET("/addresses", usersHandler.GetAddresses)
				userRoutes.POST("/addresses", usersHandler.AddAddress)
				userRoutes.PUT("/addresses/:id", usersHandler.UpdateAddress)
				userRoutes.DELETE("/addresses/:id", usersHandler.DeleteAddress)
			}

			// Order routes (accessible by all authenticated users with restrictions)
			orderRoutes := protected.Group("/orders")
			{
				orderRoutes.POST("/", ordersHandler.CreateOrder)
				orderRoutes.GET("/:id", ordersHandler.GetOrder)
				orderRoutes.GET("/:id/track", ordersHandler.TrackOrder)
				orderRoutes.POST("/:id/cancel", ordersHandler.CancelOrder)
				orderRoutes.POST("/:id/rate", ordersHandler.RateOrder)
			}

			// Student specific routes
			studentRoutes := protected.Group("/student")
			studentRoutes.Use(middleware.RequireRole("student"))
			{
				studentRoutes.GET("/orders", ordersHandler.GetStudentOrders)
			}

			// Vendor specific routes

			vendorRoutes := protected.Group("/vendors")
			vendorRoutes.Use(middleware.RequireRole("vendor"))
			{
				vendorRoutes.GET("/profile", vendorsHandler.GetVendorProfile)
				vendorRoutes.PUT("/profile", vendorsHandler.UpdateVendorProfile)
				vendorRoutes.POST("/toggle-status", vendorsHandler.ToggleOpenStatus)
				// Add this route in the vendor routes section

				vendorRoutes.POST("/upload-image", vendorsHandler.UploadImage)

				// Menu management
				vendorRoutes.GET("/menu", vendorsHandler.GetMenuItems)
				vendorRoutes.POST("/menu", vendorsHandler.AddMenuItem)
				vendorRoutes.PUT("/menu/:id", vendorsHandler.UpdateMenuItem)
				vendorRoutes.DELETE("/menu/:id", vendorsHandler.DeleteMenuItem)
				vendorRoutes.POST("/menu/:id/toggle", vendorsHandler.ToggleMenuItemAvailability)

				// Order management
				vendorRoutes.GET("/orders", vendorsHandler.GetOrders)
				vendorRoutes.GET("/orders/:id", vendorsHandler.GetOrder)
				vendorRoutes.POST("/orders/:id/accept", vendorsHandler.AcceptOrder)
				vendorRoutes.POST("/orders/:id/reject", vendorsHandler.RejectOrder)
				vendorRoutes.POST("/orders/:id/ready", vendorsHandler.MarkOrderReady)
				// Allow vendors to update order status (preparing/ready)
				vendorRoutes.POST("/orders/:id/status", vendorsHandler.UpdateOrderStatus)

				// Earnings
				vendorRoutes.GET("/earnings", vendorsHandler.GetEarnings)
			}

			// Rider specific routes
			riderRoutes := protected.Group("/riders")
			riderRoutes.Use(middleware.RequireRole("rider"))
			{
				riderRoutes.GET("/profile", ridersHandler.GetRiderProfile)
				riderRoutes.PUT("/profile", ridersHandler.UpdateRiderProfile)
				riderRoutes.POST("/location", ridersHandler.UpdateLocation)
				riderRoutes.POST("/toggle-availability", ridersHandler.ToggleAvailability)

				// Order management
				riderRoutes.GET("/orders", ridersHandler.GetAssignedOrders)
				riderRoutes.GET("/available-orders", ridersHandler.GetAvailableOrders)
				riderRoutes.POST("/orders/:id/claim", ridersHandler.ClaimOrder)
				riderRoutes.GET("/orders/:id", ridersHandler.GetOrder)
				riderRoutes.POST("/orders/:id/pickup", ridersHandler.PickUpOrder)
				riderRoutes.POST("/orders/:id/deliver", ridersHandler.DeliverOrder)

				// Earnings
				riderRoutes.GET("/earnings", ridersHandler.GetEarnings)
				riderRoutes.GET("/deliveries", ridersHandler.GetDeliveryHistory)
			}

			// Admin specific routes
			adminRoutes := protected.Group("/admin")
			adminRoutes.Use(middleware.RequireRole("admin"))
			{
				adminRoutes.GET("/dashboard", adminHandler.GetDashboard)
				// User management
				adminRoutes.POST("/vendors", adminHandler.CreateVendor)
				adminRoutes.POST("/riders", adminHandler.CreateRider)
				adminRoutes.GET("/users", adminHandler.GetUsers)
				adminRoutes.GET("/users/:id", adminHandler.GetUser)
				adminRoutes.POST("/users/:id/toggle", adminHandler.ToggleUserStatus)

				// Vendor management
				adminRoutes.GET("/vendors", adminHandler.GetVendors)
				adminRoutes.GET("/vendors/:id/performance", adminHandler.GetVendorPerformance)

				// Rider management
				adminRoutes.GET("/riders", adminHandler.GetRiders)
				adminRoutes.GET("/riders/:id/performance", adminHandler.GetRiderPerformance)

				// Order management
				adminRoutes.GET("/orders", adminHandler.GetOrders)
				adminRoutes.GET("/orders/:id", adminHandler.GetOrder)
				adminRoutes.POST("/orders/:id/assign-rider", adminHandler.AssignRider)

				// Reports
				adminRoutes.GET("/reports/revenue", adminHandler.GetRevenueReport)
			}
		}

		// Public vendor/menu routes (no auth required)
		publicVendor := v1.Group("/public")
		{
			publicVendor.GET("/vendors", vendorsHandler.GetPublicVendors)
			publicVendor.GET("/vendors/:id/menu", vendorsHandler.GetPublicMenu)
			publicVendor.GET("/menu/:id", vendorsHandler.GetPublicMenuItem)
		}
	}
}
