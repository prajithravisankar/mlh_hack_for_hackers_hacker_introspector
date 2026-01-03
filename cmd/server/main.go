package main

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/introspect"
)

func main() {
	router := gin.Default()

	router.GET("/ping", func(context *gin.Context) {
		context.JSON(http.StatusOK, gin.H{
			"message": "Hacker introspector api is live!!",
		})
	})

	router.GET("/status", func(context *gin.Context) {
		currentProject := introspect.Repository{
			Name: "Hacker Introspector",
		}

		context.JSON(http.StatusOK, currentProject)
	})

	router.Run(":8080")
}
