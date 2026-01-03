package introspect

import "time"

// Repository represents the high-level metadata of the project
type Repository struct {
	Name        string         `json:"name"`
	FullName    string         `json:"full_name"`
	Description string         `json:"description"`
	HTMLURL     string         `json:"html_url"`
	Language    string         `json:"language"`  // Primary language
	Languages   map[string]int `json:"languages"` // Detailed breakdown (bytes)
	Stars       int            `json:"stargazers_count"`
	Forks       int            `json:"forks_count"`
	OpenIssues  int            `json:"open_issues_count"`
	CreatedAt   time.Time      `json:"created_at"`
}

// ContributorStats models the "Who Did What" data
// GitHub API: /repos/{owner}/{repo}/stats/contributors
type ContributorStats struct {
	Author struct {
		Login     string `json:"login"`
		AvatarURL string `json:"avatar_url"`
	} `json:"author"`
	Total int `json:"total"` // Total commits
	Weeks []struct {
		W int `json:"w"` // Week timestamp
		A int `json:"a"` // Additions
		D int `json:"d"` // Deletions
		C int `json:"c"` // Commits
	} `json:"weeks"`
}

// AnalyticsReport is the final object we send to the frontend
type AnalyticsReport struct {
	RepoInfo     Repository         `json:"repo_info"`
	Contributors []ContributorStats `json:"contributors"`
	FileTypes    map[string]int     `json:"file_types"`
	GeneratedAt  time.Time          `json:"generated_at"`
}
