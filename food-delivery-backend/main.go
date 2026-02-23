package main

import (
	"context"
	"food-delivery-backend/admin"
	"food-delivery-backend/auth"
	"food-delivery-backend/config"
	"food-delivery-backend/database"
	"food-delivery-backend/logger"
	"food-delivery-backend/middleware"
	"food-delivery-backend/notifications"
	"food-delivery-backend/orders"
	"food-delivery-backend/pkg"
	"food-delivery-backend/redis"
	"food-delivery-backend/riders"
	"food-delivery-backend/routes"
	"food-delivery-backend/users"
	"food-delivery-backend/vendors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Initialize logger
	log := logger.InitLogger(cfg.LogLevel)
	defer log.Sync()

	// Connect to database
	db, err := database.NewPostgresDB(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database", zap.Error(err))
	}

	// Connect to Redis
	redisClient, err := redis.NewRedisClient(cfg)
	if err != nil {
		log.Fatal("Failed to connect to Redis", zap.Error(err))
	}
	defer redisClient.Close()

	// Initialize WebSocket hub
	wsHub := notifications.NewHub(log, db)
	go wsHub.Run()

	// Notifications service (used by multiple modules)
	notifier := notifications.NewService(wsHub, log, db)

	// Initialize JWT maker
	jwtMaker := pkg.NewJWTMaker(cfg.JWTSecret)

	// Initialize repositories and services
	// Auth Module
	authRepo := auth.NewRepository(db)
	authService := auth.NewService(authRepo, cfg, log)
	authHandler := auth.NewHandler(authService, notifier, log)

	// Users Module
	usersRepo := users.NewRepository(db)
	usersService := users.NewService(usersRepo, log)
	usersHandler := users.NewHandler(usersService, log)

	// Vendors Module
	vendorsRepo := vendors.NewRepository(db)
	vendorsService := vendors.NewService(vendorsRepo, notifier, redisClient, log)
	vendorsHandler := vendors.NewHandler(vendorsService, log)

	// Riders Module
	ridersRepo := riders.NewRepository(db)
	ridersService := riders.NewService(ridersRepo, redisClient, log)
	ridersHandler := riders.NewHandler(ridersService, log)

	// Orders Module
	ordersRepo := orders.NewRepository(db)
	ordersService := orders.NewService(ordersRepo, notifier, redisClient, db, cfg, log)
	ordersHandler := orders.NewHandler(ordersService, log)

	// Admin Module
	adminRepo := admin.NewRepository(db)
	adminService := admin.NewService(adminRepo, redisClient, log)
	adminHandler := admin.NewHandler(adminService, log)

	// Notifications Module
	notificationsHandler := notifications.NewHandler(db, log)

	// Setup Gin router
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.LoggerMiddleware(log))
	router.Use(middleware.CORSMiddleware())

	// Serve uploaded files
	router.Static("/uploads", "./uploads")

	// Setup routes
	routes.SetupRoutes(
		router,
		authHandler,
		usersHandler,
		vendorsHandler,
		ridersHandler,
		ordersHandler,
		adminHandler,
		notificationsHandler,
		wsHub,
		jwtMaker,
		log,
	)

	// Start server
	srv := &http.Server{
		Addr:    "127.0.0.1:" + cfg.Port,
		Handler: router,
	}

	go func() {
		log.Info("Starting server on port " + cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown", zap.Error(err))
	}

	log.Info("Server exiting")
}
