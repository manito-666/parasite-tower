package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// SetupRoutes 仅暴露静态托管。游戏规则权威在 Android JS 端，
// 历史 Web mirror 已删除（见 CLAUDE.md "规则权威：JS 唯一"）。
func SetupRoutes(r *gin.Engine) {
	r.Static("/static", "./assets/static")
	r.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/static/index.html")
	})
}
