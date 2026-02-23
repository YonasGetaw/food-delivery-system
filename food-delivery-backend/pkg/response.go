package pkg

import (
    "github.com/gin-gonic/gin"
)

type Response struct {
    Success bool        `json:"success"`
    Message string      `json:"message,omitempty"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
}

type PaginatedResponse struct {
    Success    bool        `json:"success"`
    Message    string      `json:"message,omitempty"`
    Data       interface{} `json:"data"`
    Pagination Pagination  `json:"pagination"`
}

type Pagination struct {
    Page      int   `json:"page"`
    Limit     int   `json:"limit"`
    TotalRows int64 `json:"total_rows"`
    TotalPages int  `json:"total_pages"`
}

func SendSuccess(c *gin.Context, status int, message string, data interface{}) {
    c.JSON(status, Response{
        Success: true,
        Message: message,
        Data:    data,
    })
}

func SendError(c *gin.Context, status int, message string, err interface{}) {
    var errStr string
    if err != nil {
        switch v := err.(type) {
        case string:
            errStr = v
        case error:
            errStr = v.Error()
        default:
            errStr = "unknown error"
        }
    }
    c.JSON(status, Response{
        Success: false,
        Message: message,
        Error:   errStr,
    })
}

func SendPaginated(c *gin.Context, status int, message string, data interface{}, page, limit int, totalRows int64) {
    totalPages := int(totalRows) / limit
    if int(totalRows)%limit != 0 {
        totalPages++
    }

    c.JSON(status, PaginatedResponse{
        Success: true,
        Message: message,
        Data:    data,
        Pagination: Pagination{
            Page:      page,
            Limit:     limit,
            TotalRows: totalRows,
            TotalPages: totalPages,
        },
    })
}