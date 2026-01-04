package github

import (
	"encoding/base64"
	"fmt"
	"strings"
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

// FileNode represents a node in the file tree structure (for frontend)
type FileNode struct {
	Name     string     `json:"name"`
	Path     string     `json:"path"`
	Type     string     `json:"type"` // "file" or "folder"
	Children []FileNode `json:"children,omitempty"`
}

// FetchFileTree fetches the complete file tree for a repository and returns it as a hierarchical structure
func (c *Client) FetchFileTree(owner, repo string) ([]FileNode, error) {
	// Use the existing FetchRepoTree method
	treeResp, err := c.FetchRepoTree(owner, repo)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch tree: %w", err)
	}

	// Build the hierarchical tree structure
	return buildFileTree(treeResp.Tree), nil
}

// buildFileTree converts flat GitHub tree entries into a hierarchical structure
func buildFileTree(entries []TreeEntry) []FileNode {
	// Create a map to store nodes by path (using pointers)
	nodeMap := make(map[string]*FileNode)
	
	// Root node to collect top-level items
	root := &FileNode{
		Name:     "",
		Path:     "",
		Type:     "folder",
		Children: []FileNode{},
	}
	nodeMap[""] = root

	// First pass: create all nodes and ensure parent folders exist
	for _, entry := range entries {
		nodeType := "file"
		if entry.Type == "tree" {
			nodeType = "folder"
		}

		// Get the name from the path
		parts := strings.Split(entry.Path, "/")
		name := parts[len(parts)-1]

		node := &FileNode{
			Name:     name,
			Path:     entry.Path,
			Type:     nodeType,
			Children: nil,
		}

		if nodeType == "folder" {
			node.Children = []FileNode{}
		}

		nodeMap[entry.Path] = node
	}

	// Second pass: build hierarchy by linking children to parents
	for _, entry := range entries {
		parts := strings.Split(entry.Path, "/")
		
		var parentPath string
		if len(parts) == 1 {
			parentPath = "" // Root level
		} else {
			parentPath = strings.Join(parts[:len(parts)-1], "/")
		}

		// Get parent node
		parent, parentExists := nodeMap[parentPath]
		if !parentExists {
			// Parent doesn't exist (shouldn't happen with recursive tree), use root
			parent = root
		}

		// Get current node
		currentNode := nodeMap[entry.Path]
		
		// Append to parent's children
		parent.Children = append(parent.Children, *currentNode)
	}

	// Now we need to rebuild with updated children
	// The issue is that when we append currentNode to parent.Children,
	// we're copying the value at that moment, so we need to do a final rebuild
	
	return buildTreeRecursive(root.Children, nodeMap)
}

// buildTreeRecursive rebuilds the tree with proper nested children
func buildTreeRecursive(nodes []FileNode, nodeMap map[string]*FileNode) []FileNode {
	result := make([]FileNode, 0, len(nodes))
	
	for _, node := range nodes {
		newNode := FileNode{
			Name: node.Name,
			Path: node.Path,
			Type: node.Type,
		}
		
		if node.Type == "folder" {
			// Get the actual children from the map
			if mapNode, exists := nodeMap[node.Path]; exists && len(mapNode.Children) > 0 {
				newNode.Children = buildTreeRecursive(mapNode.Children, nodeMap)
			} else {
				newNode.Children = []FileNode{}
			}
		}
		
		result = append(result, newNode)
	}
	
	// Sort: folders first, then files, both alphabetically
	sortFileNodes(result)
	
	return result
}

// sortFileNodes sorts file nodes: folders first, then files, both alphabetically
func sortFileNodes(nodes []FileNode) {
	// Sort current level
	for i := 0; i < len(nodes); i++ {
		for j := i + 1; j < len(nodes); j++ {
			// Folders come before files
			if nodes[j].Type == "folder" && nodes[i].Type == "file" {
				nodes[i], nodes[j] = nodes[j], nodes[i]
			} else if nodes[i].Type == nodes[j].Type && nodes[i].Name > nodes[j].Name {
				// Same type, sort alphabetically
				nodes[i], nodes[j] = nodes[j], nodes[i]
			}
		}
		// Recursively sort children
		if nodes[i].Type == "folder" && len(nodes[i].Children) > 0 {
			sortFileNodes(nodes[i].Children)
		}
	}
}
