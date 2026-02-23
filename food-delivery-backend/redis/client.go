package redis

import (
    "context"
    "fmt"
    "time"
    "food-delivery-backend/config"
    "github.com/go-redis/redis/v8"
)

type RedisClient struct {
    Client *redis.Client
}

func NewRedisClient(cfg *config.Config) (*RedisClient, error) {
    client := redis.NewClient(&redis.Options{
        Addr:     fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
        Password: cfg.RedisPassword,
        DB:       cfg.RedisDB,
    })

    // Test connection
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := client.Ping(ctx).Err(); err != nil {
        return nil, fmt.Errorf("failed to connect to Redis: %w", err)
    }

    return &RedisClient{Client: client}, nil
}

func (r *RedisClient) Close() error {
    return r.Client.Close()
}

// Rider availability methods
func (r *RedisClient) SetRiderAvailable(ctx context.Context, riderID uint, lat, lng float64) error {
    // Set rider location in geo index
    _, err := r.Client.GeoAdd(ctx, "riders:locations", &redis.GeoLocation{
        Name:      fmt.Sprintf("%d", riderID),
        Latitude:  lat,
        Longitude: lng,
    }).Result()
    if err != nil {
        return err
    }
    
    // Set rider available flag
    err = r.Client.Set(ctx, fmt.Sprintf("rider:%d:available", riderID), "true", 0).Err()
    if err != nil {
        return err
    }
    
    // Set rider last update
    err = r.Client.Set(ctx, fmt.Sprintf("rider:%d:last_update", riderID), time.Now().Unix(), 0).Err()
    
    return err
}

func (r *RedisClient) SetRiderUnavailable(ctx context.Context, riderID uint) error {
    // Remove from geo index
    _, err := r.Client.ZRem(ctx, "riders:locations", fmt.Sprintf("%d", riderID)).Result()
    if err != nil {
        return err
    }
    
    // Set rider unavailable
    err = r.Client.Set(ctx, fmt.Sprintf("rider:%d:available", riderID), "false", 0).Err()
    
    return err
}

func (r *RedisClient) FindNearestRiders(ctx context.Context, lat, lng float64, radius float64) ([]redis.GeoLocation, error) {
    return r.Client.GeoRadius(ctx, "riders:locations", lng, lat, &redis.GeoRadiusQuery{
        Radius:      radius,
        Unit:        "km",
        WithCoord:   true,
        WithDist:    true,
        Count:       10,
        Sort:        "ASC",
    }).Result()
}

func (r *RedisClient) IsRiderAvailable(ctx context.Context, riderID uint) (bool, error) {
    val, err := r.Client.Get(ctx, fmt.Sprintf("rider:%d:available", riderID)).Result()
    if err == redis.Nil {
        return false, nil
    }
    if err != nil {
        return false, err
    }
    return val == "true", nil
}

// Active order caching
func (r *RedisClient) CacheActiveOrder(ctx context.Context, orderID uint, data interface{}, ttl time.Duration) error {
    key := fmt.Sprintf("order:%d:active", orderID)
    return r.Client.Set(ctx, key, data, ttl).Err()
}

func (r *RedisClient) GetActiveOrder(ctx context.Context, orderID uint) (string, error) {
    key := fmt.Sprintf("order:%d:active", orderID)
    return r.Client.Get(ctx, key).Result()
}

func (r *RedisClient) RemoveActiveOrder(ctx context.Context, orderID uint) error {
    key := fmt.Sprintf("order:%d:active", orderID)
    return r.Client.Del(ctx, key).Err()
}

// Vendor status caching
func (r *RedisClient) SetVendorStatus(ctx context.Context, vendorID uint, isOpen bool) error {
    key := fmt.Sprintf("vendor:%d:status", vendorID)
    value := "closed"
    if isOpen {
        value = "open"
    }
    return r.Client.Set(ctx, key, value, time.Hour).Err()
}

func (r *RedisClient) GetVendorStatus(ctx context.Context, vendorID uint) (bool, error) {
    key := fmt.Sprintf("vendor:%d:status", vendorID)
    val, err := r.Client.Get(ctx, key).Result()
    if err == redis.Nil {
        return false, nil
    }
    if err != nil {
        return false, err
    }
    return val == "open", nil
}

// Rate limiting
func (r *RedisClient) IncrementRequestCount(ctx context.Context, userID uint, window time.Duration) (int64, error) {
    key := fmt.Sprintf("ratelimit:user:%d", userID)
    count, err := r.Client.Incr(ctx, key).Result()
    if err != nil {
        return 0, err
    }
    if count == 1 {
        r.Client.Expire(ctx, key, window)
    }
    return count, nil
}