package main

import (
	"log"
	"parasite-tower/internal/api"
	"github.com/gin-gonic/gin"
)

func main() {
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()
	api.SetupRoutes(r)

	log.Println("寄生魔塔服务器启动在 :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
