package github

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

type Client struct {
	token      string
	httpClient *http.Client
}

func NewClient() *Client {
	return &Client{
		token: os.Getenv("GITHUB_TOKEN"),
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (client *Client) get(url string, target interface{}) error {
	request, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}

	request.Header.Set("Authorization", "token "+client.token)
	request.Header.Set("Accept", "application/vnd.github.v3+json")

	response, err := client.httpClient.Do(request)
	if err != nil {
		return err
	}

	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("github api error: %s returned status %d", url, response.StatusCode)
	}

	return json.NewDecoder(response.Body).Decode(target)
}

func ExtractOwnerAndRepo(repoURL string) (string, string, error) {
	trimmed := strings.TrimPrefix(repoURL, "https://")
	trimmed = strings.TrimPrefix(trimmed, "http://")
	parts := strings.Split(trimmed, "/")

	if len(parts) < 3 || parts[0] != "github.com" {
		return "", "", fmt.Errorf("invalid github url")
	}

	return parts[1], parts[2], nil
}

func (client *Client) FetchCommitsRaw(owner, repo, since, until string) ([]map[string]interface{}, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/commits?per_page=100", owner, repo)

	if since != "" {
		url += fmt.Sprintf("&since=%sT00:00:00Z", since)
	}

	if until != "" {
		url += fmt.Sprintf("&until=%sT23:59:59Z", until)
	}

	var allCommits []map[string]interface{}

	for url != "" {
		var pageCommits []map[string]interface{}

		if err := client.get(url, &pageCommits); err != nil {
			return nil, err
		}

		allCommits = append(allCommits, pageCommits...)

		break // for mvp no more than 100 commits
	}

	return allCommits, nil
}
