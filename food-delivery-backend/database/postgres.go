package database

import (
    "fmt"
    "log"
    "time"
    "food-delivery-backend/config"
    "food-delivery-backend/pkg"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

func NewPostgresDB(cfg *config.Config) (*gorm.DB, error) {
    var dsn string
    
    // Use DATABASE_URL if available, otherwise build from individual components
    if cfg.DatabaseURL != "" {
        dsn = cfg.DatabaseURL
    } else {
        dsn = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
            cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBSSLMode)
    }
    
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
        NowFunc: func() time.Time {
            return time.Now().UTC()
        },
    })
    if err != nil {
        return nil, fmt.Errorf("failed to connect to database: %w", err)
    }

    // Get generic database object to set connection pool
    sqlDB, err := db.DB()
    if err != nil {
        return nil, fmt.Errorf("failed to get database connection: %w", err)
    }

    // Set connection pool settings from config
    sqlDB.SetMaxIdleConns(cfg.DBMaxIdleConns)
    sqlDB.SetMaxOpenConns(cfg.DBMaxOpenConns)
    sqlDB.SetConnMaxLifetime(time.Duration(cfg.DBConnMaxLifetime) * time.Second)

    // Auto migrate schemas
    err = db.AutoMigrate(
        &User{},
        &Student{},
        &Vendor{},
        &Rider{},
        &MenuItem{},
        &Order{},
        &OrderItem{},
        &Payment{},
        &Transaction{},
        &Notification{},
        &Review{},
        &Address{},
    )
    if err != nil {
        return nil, fmt.Errorf("failed to migrate database: %w", err)
    }

    // Create indexes for performance
    createIndexes(db)

    // Create default admin if not exists
    createDefaultAdmin(db, cfg)

    log.Println("Database connected and migrated successfully")
    return db, nil
}

func createIndexes(db *gorm.DB) {
    // Order indexes
    db.Exec("CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC)")
    db.Exec("CREATE INDEX IF NOT EXISTS idx_orders_vendor_status ON orders(vendor_id, status)")
    db.Exec("CREATE INDEX IF NOT EXISTS idx_orders_rider_status ON orders(assigned_rider_id, status)")
    db.Exec("CREATE INDEX IF NOT EXISTS idx_orders_student_created ON orders(student_id, created_at DESC)")
    db.Exec("CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)")

    // Menu items indexes
    db.Exec("CREATE INDEX IF NOT EXISTS idx_menu_items_vendor_available ON menu_items(vendor_id, is_available)")
    db.Exec("CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category)")
    db.Exec("CREATE INDEX IF NOT EXISTS idx_menu_items_vendor_category ON menu_items(vendor_id, category)")

    // Notifications index
    db.Exec("CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read)")
    db.Exec("CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC)")

    // Users index
    db.Exec("CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active)")
    db.Exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    db.Exec("CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)")

    // Addresses index
    db.Exec("CREATE INDEX IF NOT EXISTS idx_addresses_user_default ON addresses(user_id, is_default)")

    // Reviews index
    db.Exec("CREATE INDEX IF NOT EXISTS idx_reviews_vendor_rating ON reviews(vendor_id, rating)")
    db.Exec("CREATE INDEX IF NOT EXISTS idx_reviews_rider_rating ON reviews(rider_id, rating)")

    // Transactions index
    db.Exec("CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC)")
    db.Exec("CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_id)")

    log.Println("Database indexes created successfully")
}

func createDefaultAdmin(db *gorm.DB, cfg *config.Config) {
    var count int64
    db.Model(&User{}).Where("role = ?", RoleAdmin).Count(&count)
    
    if count == 0 {
        // Hash the admin password
        hashedPassword, err := pkg.HashPassword(cfg.AdminPassword)
        if err != nil {
            log.Printf("Failed to hash admin password: %v", err)
            return
        }

        admin := &User{
            Email:        cfg.AdminEmail,
            PasswordHash: hashedPassword,
            FirstName:    cfg.AdminFirstName,
            LastName:     cfg.AdminLastName,
            Phone:        cfg.AdminPhone,
            Role:         RoleAdmin,
            IsActive:     true,
        }
        
        if err := db.Create(admin).Error; err != nil {
            log.Printf("Failed to create admin user: %v", err)
        } else {
            log.Printf("Default admin user created successfully with email: %s", cfg.AdminEmail)
        }
    }
}

// CloseDB closes the database connection
func CloseDB(db *gorm.DB) error {
    sqlDB, err := db.DB()
    if err != nil {
        return err
    }
    return sqlDB.Close()
}

// HealthCheck checks the database connection
func HealthCheck(db *gorm.DB) error {
    sqlDB, err := db.DB()
    if err != nil {
        return err
    }
    return sqlDB.Ping()
}

// TruncateTables truncates all tables (useful for testing only)
func TruncateTables(db *gorm.DB) error {
    tables := []string{
        "reviews",
        "notifications",
        "transactions",
        "payments",
        "order_items",
        "orders",
        "menu_items",
        "addresses",
        "riders",
        "vendors",
        "students",
        "users",
    }

    for _, table := range tables {
        if err := db.Exec("TRUNCATE TABLE " + table + " CASCADE").Error; err != nil {
            return err
        }
    }
    return nil
}