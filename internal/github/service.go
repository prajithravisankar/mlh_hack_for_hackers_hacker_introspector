package github

import (
	"fmt"
	"sync"
	"time"

	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/models"
)

func (client *Client) FetchEverything(owner, repoName string) (*models.AnalyticsReport, error) {
	baseURL := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repoName)

	report := &models.AnalyticsReport{
		GeneratedAt: time.Now(),
	}

	var waitGroup sync.WaitGroup
	var err1, err2, err3 error

	// 1. Fetch Basic Metadata
	waitGroup.Add(1)
	go func() {
		defer waitGroup.Done()
		err1 = client.get(baseURL, &report.RepoInfo)
	}()

	// 2. Fetch Languages
	waitGroup.Add(1)
	go func() {
		defer waitGroup.Done()
		err2 = client.get(baseURL+"/languages", &report.RepoInfo.Languages)
	}()

	// 3. Fetch Contributors
	waitGroup.Add(1)
	go func() {
		defer waitGroup.Done()
		err3 = client.get(baseURL+"/stats/contributors", &report.Contributors)
	}()

	waitGroup.Wait()

	if err1 != nil {
		return nil, fmt.Errorf("failed to fetch metadata: %w", err1)
	}
	if err2 != nil {
		return nil, fmt.Errorf("failed to fetch languages: %w", err2)
	}
	if err3 != nil {
		fmt.Println("WARNING: Could not fetch contributors (might be processing):", err3)
	}

	report.RepoInfo.FullName = fmt.Sprintf("%s/%s", owner, repoName)
	report.FileTypes = report.RepoInfo.Languages

	return report, nil
}
