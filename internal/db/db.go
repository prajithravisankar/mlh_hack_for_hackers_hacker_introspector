package db

import (
	"fmt"
	"log"

	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/introspect"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var Database *gorm.DB

func Init() {

	var err error

	// Default to SQLite file in dev.db in project root
	databasePath := "dev.db"
	Database, err = gorm.Open(sqlite.Open(databasePath), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to SQLite: %v", err)
	}
	fmt.Println("connected to sqlite at", databasePath)

	if err := Database.AutoMigrate(&introspect.Repository{}, &introspect.ContributorStats{}, &introspect.AnalyticsReport{}); err != nil {
		log.Fatalf("auto migrate failed: %v", err)
	}
	fmt.Println("Database migrations worked")
}
