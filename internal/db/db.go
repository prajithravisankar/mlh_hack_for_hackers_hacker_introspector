package db

import (
	"fmt"
	"log"
	"os"

	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var GlobalDatabaseAccessor *gorm.DB

func InitializeDatabase() {
	productionDatabaseURL := os.Getenv("DATABASE_URL")

	var databaseError error

	if productionDatabaseURL != "" {
		fmt.Println("Connecting to Production Database...")
		// Add Postgres connection logic here later
	} else {
		fmt.Println("Connecting to Development Database...")
		localStoragePath := "dev.db"
		GlobalDatabaseAccessor, databaseError = gorm.Open(sqlite.Open(localStoragePath), &gorm.Config{})

		if databaseError != nil {
			log.Fatalf("Critical: Could not connect to local SQLite: %v", databaseError)
		}
		fmt.Println("Successfully connected to local SQLite at:", localStoragePath)
	}

	// AutoMigrate automatically creates the tables based on the NEW models package
	migrationError := GlobalDatabaseAccessor.AutoMigrate(
		&models.AnalyticsReport{},
	)

	if migrationError != nil {
		log.Fatalf("Critical: Database migration failed: %v", migrationError)
	}
	fmt.Println("Database structure updated successfully!")
}
