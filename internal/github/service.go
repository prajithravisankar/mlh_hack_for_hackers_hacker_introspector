package github

import (
	"fmt"
	"sync"
	"time"

	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/introspect"
)

func (client *Client) FetchEverything(owner, repoName string) (*introspect.AnalyticsReport, error) {
	baseURL := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repoName)

	report := &introspect.AnalyticsReport{
		GeneratedAt: time.Now(),
	}

	var waitGroup sync.WaitGroup
	var err1, err2, err3 error

	waitGroup.Add(1)
	go func ()  {
		defer waitGroup.Done()
		err1 = client.get(baseURL, &report.RepoInfo)
	}()

	waitGroup.Add(2)
	go func ()  {
		defer waitGroup.Done()
		err2 = client.get(baseURL+"languages", &report.RepoInfo.Languages)
	}()

	waitGroup.Add(3)
	go func ()  {
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
		fmt.Println("WARNING: THIS MAY OR MAY NOT BE AN ERROR, BUT WE COULD NOT FETCH CONTRIBUTORS, it sometimes take time to generate, or it has actually failed, you have to check it: ", err3)
	}

	report.RepoInfo.FullName = fmt.Sprintf("%s/%s", owner, repoName)
	report.FileTypes = report.RepoInfo.Languages

	return report, nil
}