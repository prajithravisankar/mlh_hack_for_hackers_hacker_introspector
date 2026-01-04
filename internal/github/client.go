package github

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
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
			Timeout: 30 * time.Second, // Increased timeout for larger requests
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

// getWithPagination fetches data and returns the next page URL if available
func (client *Client) getWithPagination(url string, target interface{}) (string, error) {
	request, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}

	request.Header.Set("Authorization", "token "+client.token)
	request.Header.Set("Accept", "application/vnd.github.v3+json")

	response, err := client.httpClient.Do(request)
	if err != nil {
		return "", err
	}

	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return "", fmt.Errorf("github api error: %s returned status %d", url, response.StatusCode)
	}

	// Parse Link header for pagination
	nextURL := parseLinkHeader(response.Header.Get("Link"))

	return nextURL, json.NewDecoder(response.Body).Decode(target)
}

// parseLinkHeader extracts the "next" URL from the GitHub Link header
// Example: <https://api.github.com/repos/...?page=2>; rel="next", <https://...?page=5>; rel="last"
func parseLinkHeader(linkHeader string) string {
	if linkHeader == "" {
		return ""
	}

	// Regex to find the "next" link
	re := regexp.MustCompile(`<([^>]+)>;\s*rel="next"`)
	matches := re.FindStringSubmatch(linkHeader)
	if len(matches) >= 2 {
		return matches[1]
	}
	return ""
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
	pageCount := 0

	for url != "" {
		var pageCommits []map[string]interface{}
		pageCount++

		fmt.Printf("  Fetching page %d of commits...\n", pageCount)

		nextURL, err := client.getWithPagination(url, &pageCommits)
		if err != nil {
			return nil, err
		}

		allCommits = append(allCommits, pageCommits...)

		// Move to next page (empty string means no more pages)
		url = nextURL

		// Safety limit: stop at 50 pages (5000 commits) to prevent infinite loops
		if pageCount >= 50 {
			fmt.Printf("  Reached page limit (50 pages), stopping pagination\n")
			break
		}
	}

	fmt.Printf("  Fetched %d total commits across %d pages\n", len(allCommits), pageCount)
	return allCommits, nil
}
