package github

import (
	"fmt"
	"sync"
	"time"

	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/models"
)

func (c *Client) FetchEverything(owner, repoName, startDate, endDate string) (*models.AnalyticsReport, error) {
	baseURL := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repoName)
	report := &models.AnalyticsReport{GeneratedAt: time.Now()}

	var wg sync.WaitGroup
	var err1, err2, err3 error

	// 1. Metadata (Keep this)
	wg.Add(1)
	go func() { 
		defer wg.Done()
		err1 = c.get(baseURL, &report.RepoInfo)
		if err1 != nil {
			fmt.Printf("Error fetching repo metadata: %v\n", err1)
		}
	}()

	// 2. Languages (Keep this)
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

	// 3. COMMITS (The New "Manual Labor" Logic)
	wg.Add(1)
	go func() {
		defer wg.Done()

		// A. Fetch raw list
		rawCommits, err := c.FetchCommitsRaw(owner, repoName, startDate, endDate)
		if err != nil {
			fmt.Printf("Error fetching commits: %v\n", err)
			err3 = err
			return
		}

		fmt.Printf("Fetched %d commits\n", len(rawCommits))

		// B. Process the data (Calculate our own stats)
		// Map to store User -> Commits count
		statsMap := make(map[string]int)
		avatars := make(map[string]string)

		for _, commit := range rawCommits {
			// Try to get the GitHub login
			var login string
			var avatar string

			// GitHub API structure is weird:
			// "author": { "login": "prajith", "avatar_url": "..." } -> This is the GitHub User
			// "commit": { "author": { "name": "Prajith" } } -> This is the Git Metadata

			if author, ok := commit["author"].(map[string]interface{}); ok && author != nil {
				if loginVal, ok := author["login"].(string); ok {
					login = loginVal
				}
				if avatarVal, ok := author["avatar_url"].(string); ok {
					avatar = avatarVal
				}
			} else {
				// Fallback: If not linked to GitHub user, use the Git Name
				if commitData, ok := commit["commit"].(map[string]interface{}); ok {
					if commitAuthor, ok := commitData["author"].(map[string]interface{}); ok {
						if nameVal, ok := commitAuthor["name"].(string); ok {
							login = nameVal
						}
						avatar = "" // No avatar for unlinked users
					}
				}
			}

			if login != "" {
				statsMap[login]++
				if avatar != "" {
					avatars[login] = avatar
				}
			}
		}

		fmt.Printf("Processed contributors: %+v\n", statsMap)

		// C. Convert Map to our Struct
		for login, count := range statsMap {
			contrib := models.ContributorStats{
				Total: count,
			}
			contrib.Author.Login = login
			contrib.Author.AvatarURL = avatars[login]
			report.Contributors = append(report.Contributors, contrib)
		}
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
	
	// Ensure FileTypes is never nil
	if report.RepoInfo.Languages != nil {
		report.FileTypes = report.RepoInfo.Languages
	} else {
		report.FileTypes = make(map[string]int)
	}

	return report, nil
}
