package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/joho/godotenv"

	// Import the packages we built
	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/db"
	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/github" // <--- Added this import
	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/introspect"
)

func main() {

	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found. Ensure GITHUB_TOKEN is set in system environment.")
	}

	// 1. Initialize Database
	db.InitializeDatabase()

	// 2. Initialize GitHub Client (The "General" we built)
	ghClient := github.NewClient() // <--- NEW STEP

	// 3. Create Repository (The Pantry Manager)
	repo := introspect.NewReportRepository(db.GlobalDatabaseAccessor)

	// 4. Create Handler (The Chef)
	// We now pass BOTH the repo and the github client!
	handler := introspect.NewHandler(repo, ghClient) // <--- UPDATED THIS LINE

	// 5. Setup Router
	router := gin.Default()

	// CORS Setup
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
