package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/db"
	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/introspect"
)

func main() {
	db.InitializeDatabase()

	repo := introspect.NewReportRepository(db.GlobalDatabaseAccessor)
	handler := introspect.NewHandler(repo)
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.GET("/ping", func(context *gin.Context) {
		context.JSON(http.StatusOK, gin.H{
			"message": "Hacker Introspector is online!",
		})
	})

	api := router.Group("/api")
	{
		api.POST("/analyze", handler.AnalyzeRepo)
		api.GET("/report/:owner/:repo", handler.GetReport)
	}

	log.Println("server started on port :8080...")
	router.Run(":8080")
}
