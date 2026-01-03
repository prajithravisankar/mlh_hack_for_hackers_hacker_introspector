package models

import "time"

// Repository represents the metadata.
type Repository struct {
	Name        string         `json:"name"`
	FullName    string         `json:"full_name" gorm:"index"`
	Description string         `json:"description"`
	HTMLURL     string         `json:"html_url"`
	Language    string         `json:"language"`
	Languages   map[string]int `json:"languages" gorm:"serializer:json"`
	Stars       int            `json:"stargazers_count"`
	Forks       int            `json:"forks_count"`
	OpenIssues  int            `json:"open_issues_count"`
	CreatedAt   time.Time      `json:"created_at"`
}

// ContributorStats models the "Who Did What" data.
type ContributorStats struct {
	Author struct {
		Login     string `json:"login"`
		AvatarURL string `json:"avatar_url"`
	} `json:"author"`
	Total int `json:"total"`
	Weeks []struct {
		W int `json:"w"`
		A int `json:"a"`
		D int `json:"d"`
		C int `json:"c"`
	} `json:"weeks"`
}

// AnalyticsReport is the "Master Table" in our database.
type AnalyticsReport struct {
	ID           uint               `json:"id" gorm:"primaryKey"`
	RepoInfo     Repository         `json:"repo_info" gorm:"embedded"`
	Contributors []ContributorStats `json:"contributors" gorm:"serializer:json"`
	FileTypes    map[string]int     `json:"file_types" gorm:"serializer:json"`
	GeneratedAt  time.Time          `json:"generated_at"`
}
