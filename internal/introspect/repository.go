package introspect

import (
	"fmt"

	"gorm.io/gorm"
)

type ReportRepository struct {
	// here encapsulating databaseConnection access inside the Repository strucut
	// because handlers and services should not be able to use gorm directly for safety reasons
	databaseConnection *gorm.DB
}

func NewReportRepository(db *gorm.DB) *ReportRepository {
	return &ReportRepository{
		databaseConnection: db,
	}
}

func (repo *ReportRepository) SaveReport(report *AnalyticsReport) error {
	if err := repo.databaseConnection.Save(report).Error; err != nil {
		return fmt.Errorf("could not save report to the database: %w", err)
	}
	return nil
}

func (repo *ReportRepository) GetReportByRepoName(fullName string) (*AnalyticsReport, error) {
	var report AnalyticsReport
	result := repo.databaseConnection.Where("full_name = ?", fullName).First(&report)

	if result.Error != nil {
		return nil, fmt.Errorf("report not found: %w", result.Error)
	}

	return &report, nil
}
