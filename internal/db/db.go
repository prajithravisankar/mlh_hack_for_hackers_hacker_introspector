package db

import (
	"fmt"
	"log"
	"os"

	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/introspect"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var GlobalDatabaseAccessor *gorm.DB

func InitializeDatabase() {
	productionDatabaseURL := os.Getenv("DATABASE_URL")

	var databaseError error

	if productionDatabaseURL != "" {
		fmt.Println("Connecting to Production Database...")
	} else {
		// Default to local SQLite for development
		fmt.Println("Connecting to Development Database...")
		localStoragePath := "dev.db"
		GlobalDatabaseAccessor, databaseError = gorm.Open(sqlite.Open(localStoragePath), &gorm.Config{})

		if databaseError != nil {
			log.Fatalf("Critical: Could not connect to local SQLite: %v", databaseError)
		}
		fmt.Println("Successfully connected to local SQLite at:", localStoragePath)
	}

	// AutoMigrate automatically creates the tables in your DB based on your models
	migrationError := GlobalDatabaseAccessor.AutoMigrate(
		&introspect.Repository{},
		&introspect.ContributorStats{},
		&introspect.AnalyticsReport{},
	)

	if migrationError != nil {
		log.Fatalf("Critical: Database migration failed: %v", migrationError)
	}
	fmt.Println("Database structure updated successfully!")
}
