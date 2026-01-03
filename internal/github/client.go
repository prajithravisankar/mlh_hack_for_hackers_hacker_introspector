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
