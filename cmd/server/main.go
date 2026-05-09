package main

import (
	"log"
	"net/http"
	"time"

	"parasite-tower/internal/api"

	"github.com/gin-gonic/gin"
)

// 寄生塔静态托管服务器：只做 /health + 静态文件。
// 游戏规则权威在 Android JS 端，此服务器不参与任何游戏逻辑（见 CLAUDE.md）。
func main() {
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "time": time.Now().Unix()})
	})

	api.SetupRoutes(r)

	log.Println("寄生塔静态服务器启动在 :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
