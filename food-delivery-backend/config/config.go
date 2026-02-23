package config

import (
    "log"
    "os"
    "strconv"
    "strings"
    "github.com/joho/godotenv"
)

type Config struct {
    // Database
    DatabaseURL      string
    DBHost           string
    DBPort           string
    DBUser           string
    DBPassword       string
    DBName           string
    DBSSLMode        string
    DBMaxIdleConns   int
    DBMaxOpenConns   int
    DBConnMaxLifetime int

    // Server
    Port         string
    JWTSecret    string
    JWTExpiry    int

    // Redis
    RedisHost     string
    RedisPort     string
    RedisPassword string
    RedisDB       int

    // Application
    DefaultCommissionRate float64
    DeliveryFee          float64
    ServiceFeeRate       float64
    RiderEarningsRate    float64
    OrderTimeoutMinutes  int
    MaxOrderItems        int
    MaxOrderQuantity     int

    // File Upload
    MaxUploadSize      int64
    AllowedImageTypes  []string
    UploadPath         string

    // CORS
    CORSAllowedOrigins []string
    CORSAllowedMethods []string
    CORSAllowedHeaders []string

    // Rate Limiting
    RateLimitRequests int
    RateLimitWindow   int

    // WebSocket
    WebsocketReadBufferSize  int
    WebsocketWriteBufferSize int
    WebsocketPingInterval    int

    // Admin Defaults
    AdminEmail     string
    AdminPassword  string
    AdminFirstName string
    AdminLastName  string
    AdminPhone     string

    // Environment
    Environment string
    APIBaseURL  string
    ClientURL   string

    // Logging
    LogLevel string
}

func LoadConfig() *Config {
    err := godotenv.Load()
    if err != nil {
        log.Println("Warning: .env file not found, using environment variables")
    }

    config := &Config{
        // Database - try DATABASE_URL first, then fall back to individual params
        DatabaseURL:      getEnv("DATABASE_URL", ""),
        DBHost:           getEnv("DB_HOST", "localhost"),
        DBPort:           getEnv("DB_PORT", "5432"),
        DBUser:           getEnv("DB_USER", "postgres"),
        DBPassword:       getEnv("DB_PASSWORD", ""),
        DBName:           getEnv("DB_NAME", "food_delivery"),
        DBSSLMode:        getEnv("DB_SSLMODE", "disable"),
        DBMaxIdleConns:   getEnvAsInt("DB_MAX_IDLE_CONNS", 10),
        DBMaxOpenConns:   getEnvAsInt("DB_MAX_OPEN_CONNS", 100),
        DBConnMaxLifetime: getEnvAsInt("DB_CONN_MAX_LIFETIME", 3600),

        // Server
        Port:         getEnv("PORT", "8080"),
        JWTSecret:    getEnv("JWT_SECRET", "your-secret-key"),
        JWTExpiry:    getEnvAsInt("JWT_EXPIRY_HOURS", 24),

        // Redis
        RedisHost:     getEnv("REDIS_HOST", "localhost"),
        RedisPort:     getEnv("REDIS_PORT", "6379"),
        RedisPassword: getEnv("REDIS_PASSWORD", ""),
        RedisDB:       getEnvAsInt("REDIS_DB", 0),

        // Application
        DefaultCommissionRate: getEnvAsFloat("DEFAULT_COMMISSION_RATE", 0.15),
        DeliveryFee:          getEnvAsFloat("DELIVERY_FEE", 2.50),
        ServiceFeeRate:       getEnvAsFloat("SERVICE_FEE_RATE", 0.05),
        RiderEarningsRate:    getEnvAsFloat("RIDER_EARNINGS_RATE", 0.80),
        OrderTimeoutMinutes:  getEnvAsInt("ORDER_TIMEOUT_MINUTES", 30),
        MaxOrderItems:        getEnvAsInt("MAX_ORDER_ITEMS", 50),
        MaxOrderQuantity:     getEnvAsInt("MAX_ORDER_QUANTITY_PER_ITEM", 10),

        // File Upload
        MaxUploadSize:      getEnvAsInt64("MAX_UPLOAD_SIZE", 5) * 1024 * 1024, // Convert MB to bytes
        AllowedImageTypes:  getEnvAsSlice("ALLOWED_IMAGE_TYPES", []string{"jpg", "jpeg", "png", "gif"}),
        UploadPath:         getEnv("UPLOAD_PATH", "./uploads"),

        // CORS
        CORSAllowedOrigins: getEnvAsSlice("CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000", "http://localhost:8080"}),
        CORSAllowedMethods: getEnvAsSlice("CORS_ALLOWED_METHODS", []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}),
        CORSAllowedHeaders: getEnvAsSlice("CORS_ALLOWED_HEADERS", []string{"Content-Type", "Content-Length", "Accept-Encoding", "Authorization"}),

        // Rate Limiting
        RateLimitRequests: getEnvAsInt("RATE_LIMIT_REQUESTS", 100),
        RateLimitWindow:   getEnvAsInt("RATE_LIMIT_WINDOW", 60),

        // WebSocket
        WebsocketReadBufferSize:  getEnvAsInt("WEBSOCKET_READ_BUFFER_SIZE", 1024),
        WebsocketWriteBufferSize: getEnvAsInt("WEBSOCKET_WRITE_BUFFER_SIZE", 1024),
        WebsocketPingInterval:    getEnvAsInt("WEBSOCKET_PING_INTERVAL", 30),

        // Admin Defaults
        AdminEmail:     getEnv("ADMIN_EMAIL", "admin@fooddelivery.com"),
        AdminPassword:  getEnv("ADMIN_PASSWORD", "Admin@123"),
        AdminFirstName: getEnv("ADMIN_FIRST_NAME", "Admin"),
        AdminLastName:  getEnv("ADMIN_LAST_NAME", "User"),
        AdminPhone:     getEnv("ADMIN_PHONE", "0000000000"),

        // Environment
        Environment: getEnv("ENVIRONMENT", "development"),
        APIBaseURL:  getEnv("API_BASE_URL", "http://localhost:8080"),
        ClientURL:   getEnv("CLIENT_URL", "http://localhost:3000"),

        // Logging
        LogLevel: getEnv("LOG_LEVEL", "info"),
    }

    // Parse DATABASE_URL if provided
    if config.DatabaseURL != "" {
        config.parseDatabaseURL()
    }

    return config
}

// parseDatabaseURL parses a PostgreSQL connection string and extracts individual components
func (c *Config) parseDatabaseURL() {
    // Example: postgres://username:password@host:port/database?sslmode=disable
    if !strings.HasPrefix(c.DatabaseURL, "postgres://") {
        return
    }

    // Remove the protocol
    rest := strings.TrimPrefix(c.DatabaseURL, "postgres://")

    // Split user:password@host:port/database?params
    atIndex := strings.Index(rest, "@")
    if atIndex == -1 {
        return
   }

    // Get user and password
    userPass := rest[:atIndex]
    colonIndex := strings.Index(userPass, ":")
    if colonIndex != -1 {
        c.DBUser = userPass[:colonIndex]
        c.DBPassword = userPass[colonIndex+1:]
    } else {
        c.DBUser = userPass
    }

    // Get host, port, database and params
    hostPart := rest[atIndex+1:]
    slashIndex := strings.Index(hostPart, "/")
    if slashIndex == -1 {
        return
    }

    hostPort := hostPart[:slashIndex]
    dbPart := hostPart[slashIndex+1:]

    // Parse host and port
    colonIndex = strings.Index(hostPort, ":")
    if colonIndex != -1 {
        c.DBHost = hostPort[:colonIndex]
        c.DBPort = hostPort[colonIndex+1:]
    } else {
        c.DBHost = hostPort
        c.DBPort = "5432"
    }

    // Parse database name and parameters
    questionIndex := strings.Index(dbPart, "?")
    if questionIndex != -1 {
        c.DBName = dbPart[:questionIndex]
        params := dbPart[questionIndex+1:]
        
        // Parse SSL mode
        if strings.Contains(params, "sslmode=") {
            for _, param := range strings.Split(params, "&") {
                if strings.HasPrefix(param, "sslmode=") {
                    c.DBSSLMode = strings.TrimPrefix(param, "sslmode=")
                    break
                }
            }
        }
    } else {
        c.DBName = dbPart
    }
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
    if value := os.Getenv(key); value != "" {
        if intVal, err := strconv.Atoi(value); err == nil {
            return intVal
        }
    }
    return defaultValue
}

func getEnvAsInt64(key string, defaultValue int64) int64 {
    if value := os.Getenv(key); value != "" {
        if intVal, err := strconv.ParseInt(value, 10, 64); err == nil {
            return intVal
        }
    }
    return defaultValue
}

func getEnvAsFloat(key string, defaultValue float64) float64 {
    if value := os.Getenv(key); value != "" {
        if floatVal, err := strconv.ParseFloat(value, 64); err == nil {
            return floatVal
        }
    }
    return defaultValue
}

func getEnvAsSlice(key string, defaultValue []string) []string {
    if value := os.Getenv(key); value != "" {
        return strings.Split(value, ",")
    }
    return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
    if value := os.Getenv(key); value != "" {
        return strings.ToLower(value) == "true" || value == "1"
    }
    return defaultValue
}