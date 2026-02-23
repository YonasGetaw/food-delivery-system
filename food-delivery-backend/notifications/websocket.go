package notifications

import (
    "net/http"
    "sync"
    "time"
    "github.com/gin-gonic/gin"
    "github.com/gorilla/websocket"
    "go.uber.org/zap"
    "gorm.io/gorm"
    "food-delivery-backend/database"
)

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        return true // Allow all origins in development
    },
}

type Client struct {
    Hub      *Hub
    Conn     *websocket.Conn
    Send     chan []byte
    UserID   uint
    Role     string
    VendorID *uint
    RiderID  *uint
}

type Hub struct {
    clients     map[*Client]bool
    broadcast   chan []byte
    register    chan *Client
    unregister  chan *Client
    userConns   map[uint][]*Client      // UserID -> connections
    vendorConns map[uint][]*Client      // VendorID -> connections
    riderConns  map[uint][]*Client      // RiderID -> connections
    mu          sync.RWMutex
    logger      *zap.Logger
    db          *gorm.DB
}

func NewHub(logger *zap.Logger, db *gorm.DB) *Hub {
    return &Hub{
        clients:     make(map[*Client]bool),
        broadcast:   make(chan []byte),
        register:    make(chan *Client),
        unregister:  make(chan *Client),
        userConns:   make(map[uint][]*Client),
        vendorConns: make(map[uint][]*Client),
        riderConns:  make(map[uint][]*Client),
        logger:      logger,
        db:          db,
    }
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            h.mu.Lock()
            h.clients[client] = true
            
            // Store by user ID
            h.userConns[client.UserID] = append(h.userConns[client.UserID], client)
            
            // Store by vendor ID if applicable
            if client.VendorID != nil {
                h.vendorConns[*client.VendorID] = append(h.vendorConns[*client.VendorID], client)
            }
            
            // Store by rider ID if applicable
            if client.RiderID != nil {
                h.riderConns[*client.RiderID] = append(h.riderConns[*client.RiderID], client)
            }
            
            h.mu.Unlock()
            h.logger.Info("Client registered", zap.Uint("user_id", client.UserID), zap.String("role", client.Role))

        case client := <-h.unregister:
            h.mu.Lock()
            if _, ok := h.clients[client]; ok {
                delete(h.clients, client)
                close(client.Send)
                
                // Remove from userConns
                conns := h.userConns[client.UserID]
                for i, c := range conns {
                    if c == client {
                        h.userConns[client.UserID] = append(conns[:i], conns[i+1:]...)
                        break
                    }
                }
                if len(h.userConns[client.UserID]) == 0 {
                    delete(h.userConns, client.UserID)
                }

                // Remove from vendorConns if applicable
                if client.VendorID != nil {
                    vendorConns := h.vendorConns[*client.VendorID]
                    for i, c := range vendorConns {
                        if c == client {
                            h.vendorConns[*client.VendorID] = append(vendorConns[:i], vendorConns[i+1:]...)
                            break
                        }
                    }
                    if len(h.vendorConns[*client.VendorID]) == 0 {
                        delete(h.vendorConns, *client.VendorID)
                    }
                }

                // Remove from riderConns if applicable
                if client.RiderID != nil {
                    riderConns := h.riderConns[*client.RiderID]
                    for i, c := range riderConns {
                        if c == client {
                            h.riderConns[*client.RiderID] = append(riderConns[:i], riderConns[i+1:]...)
                            break
                        }
                    }
                    if len(h.riderConns[*client.RiderID]) == 0 {
                        delete(h.riderConns, *client.RiderID)
                    }
                }
            }
            h.mu.Unlock()
            h.logger.Info("Client unregistered", zap.Uint("user_id", client.UserID))

        case message := <-h.broadcast:
            h.mu.RLock()
            for client := range h.clients {
                select {
                case client.Send <- message:
                default:
                    close(client.Send)
                    delete(h.clients, client)
                }
            }
            h.mu.RUnlock()
        }
    }
}

func (h *Hub) HandleWebSocket(c *gin.Context) {
    userID := c.GetUint("user_id")
    role := c.GetString("user_role")

    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        h.logger.Error("WebSocket upgrade failed", zap.Error(err))
        return
    }

    client := &Client{
        Hub:      h,
        Conn:     conn,
        Send:     make(chan []byte, 256),
        UserID:   userID,
        Role:     role,
    }

    // Load vendor/rider IDs if applicable
    if role == "vendor" {
        var vendor database.Vendor
        if err := h.db.Where("user_id = ?", userID).First(&vendor).Error; err == nil {
            client.VendorID = &vendor.ID
        }
    } else if role == "rider" {
        var rider database.Rider
        if err := h.db.Where("user_id = ?", userID).First(&rider).Error; err == nil {
            client.RiderID = &rider.ID
        }
    }

    client.Hub.register <- client

    // Start goroutines for reading and writing
    go client.writePump()
    go client.readPump()
}

func (c *Client) readPump() {
    defer func() {
        c.Hub.unregister <- c
        c.Conn.Close()
    }()

    for {
        _, _, err := c.Conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                c.Hub.logger.Error("WebSocket read error", zap.Error(err))
            }
            break
        }
        // We don't process incoming messages in this implementation
        // You can add handling for client messages (like ping/pong) here
    }
}

func (c *Client) writePump() {
    defer c.Conn.Close()

    for {
        select {
        case message, ok := <-c.Send:
            if !ok {
                c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }

            c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
            if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
                return
            }
        }
    }
}

// BroadcastToUser sends a message to all connections of a specific user
func (h *Hub) BroadcastToUser(userID uint, message []byte) {
    h.mu.RLock()
    clients := h.userConns[userID]
    h.mu.RUnlock()

    for _, client := range clients {
        select {
        case client.Send <- message:
        default:
            // Client's buffer is full, skip
        }
    }
}

// BroadcastToVendor sends a message to all connections of a specific vendor
func (h *Hub) BroadcastToVendor(vendorID uint, message []byte) {
    h.mu.RLock()
    clients := h.vendorConns[vendorID]
    h.mu.RUnlock()

    for _, client := range clients {
        select {
        case client.Send <- message:
        default:
        }
    }
}

// BroadcastToRider sends a message to all connections of a specific rider
func (h *Hub) BroadcastToRider(riderID uint, message []byte) {
    h.mu.RLock()
    clients := h.riderConns[riderID]
    h.mu.RUnlock()

    for _, client := range clients {
        select {
        case client.Send <- message:
        default:
        }
    }
}