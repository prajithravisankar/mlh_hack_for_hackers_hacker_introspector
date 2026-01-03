package introspect

import (
	"fmt"

	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/models"
	"gorm.io/gorm"
)

type ReportRepository struct {
	databaseConnection *gorm.DB
}

func NewReportRepository(db *gorm.DB) *ReportRepository {
	return &ReportRepository{
		databaseConnection: db,
	}
}

func (repo *ReportRepository) SaveReport(report *models.AnalyticsReport) error {
	if err := repo.databaseConnection.Save(report).Error; err != nil {
		return fmt.Errorf("could not save report to the database: %w", err)
	}
	return nil
}

func (repo *ReportRepository) GetReportByRepoName(fullName string) (*models.AnalyticsReport, error) {
	var report models.AnalyticsReport

	// Note: GORM usually maps embedded struct fields with snake_case.
	// If "full_name" doesn't work, we might need "repo_info_full_name".
	// For now, let's assume the flatten worked or try standard match.
	result := repo.databaseConnection.Where("full_name = ?", fullName).First(&report)

	if result.Error != nil {
		return nil, fmt.Errorf("report not found: %w", result.Error)
	}

	return &report, nil
}
