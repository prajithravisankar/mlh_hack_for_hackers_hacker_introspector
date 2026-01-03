package github

import (
	"fmt"
	"sync"
	"time"

	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/models"
)

func (c *Client) FetchEverything(owner, repoName string) (*models.AnalyticsReport, error) {
	baseURL := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repoName)
	report := &models.AnalyticsReport{GeneratedAt: time.Now()}

	var wg sync.WaitGroup
	var err1, err2, err3 error

	// 1. Metadata
	wg.Add(1)
	go func() {
		defer wg.Done()
		err1 = c.get(baseURL, &report.RepoInfo)
		if err1 != nil {
			fmt.Printf("Error fetching repo metadata: %v\n", err1)
		}
	}()

	// 2. Languages
	wg.Add(1)
	go func() {
		defer wg.Done()
		err2 = c.get(baseURL+"/languages", &report.RepoInfo.Languages)
		if err2 != nil {
			fmt.Printf("Error fetching repo languages: %v\n", err2)
			// Don't fail the whole request if languages fail
			report.RepoInfo.Languages = make(map[string]int)
			err2 = nil
		}
	}()

	// 3. COMMITS (Always fetch most recent 100 commits for hackathon repos)
	wg.Add(1)
	go func() {
		defer wg.Done()

		// A. Fetch raw list
		rawCommits, err := c.FetchCommitsRaw(owner, repoName, "", "")
		if err != nil {
			fmt.Printf("Error fetching commits: %v\n", err)
			err3 = err
			return
		}

		fmt.Printf("Fetched %d commits\n", len(rawCommits))

		// B. Process the data
		statsMap := make(map[string]int)
		avatars := make(map[string]string)
		var timeline []time.Time // <--- NEW: Timeline slice

		for _, commit := range rawCommits {
			// --- Part 1: Extract Author (Existing logic) ---
			var login string
			var avatar string

			if author, ok := commit["author"].(map[string]interface{}); ok && author != nil {
				if loginVal, ok := author["login"].(string); ok {
					login = loginVal
				}
				if avatarVal, ok := author["avatar_url"].(string); ok {
					avatar = avatarVal
				}
			} else {
				// Fallback to git metadata
				if commitData, ok := commit["commit"].(map[string]interface{}); ok {
					if commitAuthor, ok := commitData["author"].(map[string]interface{}); ok {
						if nameVal, ok := commitAuthor["name"].(string); ok {
							login = nameVal
						}
						avatar = ""
					}
				}
			}

			if login != "" {
				statsMap[login]++
				if avatar != "" {
					avatars[login] = avatar
				}
			}

			// --- Part 2: Extract Date for Heatmap (NEW) ---
			if commitData, ok := commit["commit"].(map[string]interface{}); ok {
				if authorData, ok := commitData["author"].(map[string]interface{}); ok {
					if dateStr, ok := authorData["date"].(string); ok {
						// Parse ISO 8601 / RFC3339 date (e.g. "2024-01-01T12:00:00Z")
						if t, err := time.Parse(time.RFC3339, dateStr); err == nil {
							timeline = append(timeline, t)
						}
					}
				}
			}
		}

		// C. Save Data to Report
		// Contributors
		for login, count := range statsMap {
			contrib := models.ContributorStats{
				Total: count,
			}
			contrib.Author.Login = login
			contrib.Author.AvatarURL = avatars[login]
			report.Contributors = append(report.Contributors, contrib)
		}

		// Timeline
		report.CommitTimeline = timeline // <--- NEW: Save timeline to report
	}()

	wg.Wait()

	// Error handling...
	if err1 != nil {
		return nil, fmt.Errorf("metadata error: %w", err1)
	}
	if err2 != nil {
		return nil, fmt.Errorf("language error: %w", err2)
	}
	if err3 != nil {
		return nil, fmt.Errorf("commit fetch error: %w", err3)
	}

	report.RepoInfo.FullName = fmt.Sprintf("%s/%s", owner, repoName)

	if report.RepoInfo.Languages != nil {
		report.FileTypes = report.RepoInfo.Languages
	} else {
		report.FileTypes = make(map[string]int)
	}

	return report, nil
}
