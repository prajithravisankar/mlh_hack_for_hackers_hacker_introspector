package github

import (
	"encoding/base64"
	"fmt"
)

// TreeEntry represents a single file/folder in the repo tree
type TreeEntry struct {
	Path string `json:"path"`
	Mode string `json:"mode"`
	Type string `json:"type"` // "blob" for file, "tree" for directory
	SHA  string `json:"sha"`
	Size int    `json:"size,omitempty"`
}

// TreeResponse represents the GitHub API response for git trees
type TreeResponse struct {
	SHA       string      `json:"sha"`
	URL       string      `json:"url"`
	Tree      []TreeEntry `json:"tree"`
	Truncated bool        `json:"truncated"`
}

// FileContent represents the content of a single file
type FileContent struct {
	Name     string `json:"name"`
	Path     string `json:"path"`
	SHA      string `json:"sha"`
	Size     int    `json:"size"`
	Content  string `json:"content"`
	Encoding string `json:"encoding"`
}

// FetchRepoTree fetches the full file tree of a repository
func (c *Client) FetchRepoTree(owner, repo string) (*TreeResponse, error) {
	// First try main, then master as fallback
	branches := []string{"main", "master"}

	var lastErr error
	for _, branch := range branches {
		url := fmt.Sprintf("https://api.github.com/repos/%s/%s/git/trees/%s?recursive=1", owner, repo, branch)

		var tree TreeResponse
		err := c.get(url, &tree)
		if err == nil {
			return &tree, nil
		}
		lastErr = err
	}

	return nil, fmt.Errorf("failed to fetch tree from main or master: %w", lastErr)
}

// FetchFileContent fetches the content of a specific file
func (c *Client) FetchFileContent(owner, repo, path string) (string, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s", owner, repo, path)

	var content FileContent
	if err := c.get(url, &content); err != nil {
		return "", fmt.Errorf("failed to fetch file content for %s: %w", path, err)
	}

	// GitHub returns content as base64 encoded
	if content.Encoding == "base64" {
		decoded, err := base64.StdEncoding.DecodeString(content.Content)
		if err != nil {
			return "", fmt.Errorf("failed to decode base64 content: %w", err)
		}
		return string(decoded), nil
	}

	return content.Content, nil
}

// FetchMultipleFiles fetches content of multiple files concurrently
func (c *Client) FetchMultipleFiles(owner, repo string, paths []string) (map[string]string, error) {
	results := make(map[string]string)
	errors := make(chan error, len(paths))
	contents := make(chan struct {
		path    string
		content string
	}, len(paths))

	for _, path := range paths {
		go func(p string) {
			content, err := c.FetchFileContent(owner, repo, p)
			if err != nil {
				errors <- err
				return
			}
			contents <- struct {
				path    string
				content string
			}{p, content}
		}(path)
	}

	// Collect results
	for i := 0; i < len(paths); i++ {
		select {
		case err := <-errors:
			// Log but don't fail completely
			fmt.Printf("Warning: %v\n", err)
		case result := <-contents:
			results[result.path] = result.content
		}
	}

	if len(results) == 0 {
		return nil, fmt.Errorf("failed to fetch any files")
	}

	return results, nil
}

// GetTreeAsString converts the tree to a formatted string for AI analysis
func (t *TreeResponse) GetTreeAsString() string {
	var result string
	for _, entry := range t.Tree {
		if entry.Type == "blob" {
			result += entry.Path + "\n"
		}
	}
	return result
}
