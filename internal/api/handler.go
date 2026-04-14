package api

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

var engine *WebEngine

func SetupRoutes(r *gin.Engine) {
	r.POST("/api/game/new", handleNewGame)
	r.POST("/api/game/action", handleAction)
	r.Static("/static", "./assets/static")
	r.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/static/index.html")
	})
}

func handleNewGame(c *gin.Context) {
	engine = NewWebEngine()
	c.JSON(http.StatusOK, engine.buildState())
}

func handleAction(c *gin.Context) {
	if engine == nil {
		engine = NewWebEngine()
	}

	var req struct {
		Action string `json:"action"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	state := engine.HandleAction(req.Action)
	c.JSON(http.StatusOK, state)
}
