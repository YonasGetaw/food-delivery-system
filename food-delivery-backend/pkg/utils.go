package pkg

import (
    "math/rand"
    "time"
    "fmt"
	math "math"
)

func init() {
    rand.Seed(time.Now().UnixNano())
}

func GenerateOrderNumber() string {
    timestamp := time.Now().Unix()
    random := rand.Intn(1000)
    return fmt.Sprintf("ORD-%d-%03d", timestamp, random)
}

func GenerateTransactionID() string {
    timestamp := time.Now().UnixNano()
    random := rand.Intn(10000)
    return fmt.Sprintf("TXN-%d-%04d", timestamp, random)
}

func CalculateDistance(lat1, lng1, lat2, lng2 float64) float64 {
    const R = 6371 // Earth's radius in km
    
    dLat := (lat2 - lat1) * (3.141592653589793 / 180.0)
    dLng := (lng2 - lng1) * (3.141592653589793 / 180.0)
    
    a := math.Sin(dLat/2)*math.Sin(dLat/2) +
        math.Cos(lat1*(3.141592653589793/180.0))*math.Cos(lat2*(3.141592653589793/180.0))*
        math.Sin(dLng/2)*math.Sin(dLng/2)
    
    c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
    
    return R * c
}

func TruncateString(s string, maxLength int) string {
    if len(s) <= maxLength {
        return s
    }
    return s[:maxLength-3] + "..."
}

func SafeString(s *string) string {
    if s == nil {
        return ""
    }
    return *s
}

func Contains(slice []string, item string) bool {
    for _, s := range slice {
        if s == item {
            return true
        }
    }
    return false
}