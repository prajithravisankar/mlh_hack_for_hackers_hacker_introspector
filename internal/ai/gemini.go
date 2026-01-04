package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/github"
	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/models"
)

const (
	// Using Gemini 2.5 Flash - free tier with 5 RPM, 250K TPM, 20 RPD
	// This model is available and has quota in the free tier
	geminiFlashModel = "gemini-2.5-flash"
	geminiProModel   = "gemini-2.5-flash" // Using same model for both stages to stay in free tier
	baseURL          = "https://generativelanguage.googleapis.com/v1beta/models"
)

type GeminiClient struct {
	apiKey     string
	httpClient *http.Client
}

// GeminiRequest represents the request payload for Gemini API
type GeminiRequest struct {
	Contents         []Content        `json:"contents"`
	GenerationConfig GenerationConfig `json:"generationConfig,omitempty"`
}

type Content struct {
	Parts []Part `json:"parts"`
}

type Part struct {
	Text string `json:"text"`
}

type GenerationConfig struct {
	Temperature      float64 `json:"temperature,omitempty"`
	MaxOutputTokens  int     `json:"maxOutputTokens,omitempty"`
	ResponseMimeType string  `json:"responseMimeType,omitempty"`
}

// GeminiResponse represents the response from Gemini API
type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
		Code    int    `json:"code"`
	} `json:"error,omitempty"`
}

func NewGeminiClient() *GeminiClient {
	return &GeminiClient{
		apiKey: os.Getenv("GEMINI_API_KEY"),
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

func (g *GeminiClient) callGemini(model, prompt string, jsonOutput bool) (string, error) {
	url := fmt.Sprintf("%s/%s:generateContent?key=%s", baseURL, model, g.apiKey)

	config := GenerationConfig{
		Temperature:     0.7,
		MaxOutputTokens: 4096,
	}

	if jsonOutput {
		config.ResponseMimeType = "application/json"
	}

	reqBody := GeminiRequest{
		Contents: []Content{
			{
				Parts: []Part{
					{Text: prompt},
				},
			},
		},
		GenerationConfig: config,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to call Gemini API: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	var geminiResp GeminiResponse
	if err := json.Unmarshal(body, &geminiResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if geminiResp.Error != nil {
		return "", fmt.Errorf("Gemini API error: %s (code: %d)", geminiResp.Error.Message, geminiResp.Error.Code)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response from Gemini")
	}

	return geminiResp.Candidates[0].Content.Parts[0].Text, nil
}

// Stage 1: Analyze file tree and identify critical files
func (g *GeminiClient) IdentifyCriticalFiles(treeString string) ([]string, error) {
	prompt := fmt.Sprintf(`You are a Senior Software Architect. Analyze this file structure of a repository and identify the top 7 most critical files that reveal the core logic of this project.

Focus on:
- Main entry points (main.go, index.js, app.py, etc.)
- Core business logic files
- API handlers or controllers
- Key service/model files
- Configuration files that reveal architecture
- Database or persistence layer files
- Important utility or helper files

Ignore:
- Lock files (package-lock.json, go.sum, etc.)
- Generated files
- Test files (unless they reveal architecture)
- Assets and static files

File Structure:
%s

Return ONLY a valid JSON object with this exact structure:
{"files": ["path/to/file1", "path/to/file2", "path/to/file3", "path/to/file4", "path/to/file5", "path/to/file6", "path/to/file7"]}

Important: Return exactly 7 files. If there are fewer important files, include the most relevant ones available.`, treeString)

	response, err := g.callGemini(geminiFlashModel, prompt, true)
	if err != nil {
		return nil, fmt.Errorf("Stage 1 failed: %w", err)
	}

	// Clean up the response (remove markdown code blocks if present)
	response = strings.TrimPrefix(response, "```json")
	response = strings.TrimPrefix(response, "```")
	response = strings.TrimSuffix(response, "```")
	response = strings.TrimSpace(response)

	var fileResponse models.FileTreeResponse
	if err := json.Unmarshal([]byte(response), &fileResponse); err != nil {
		return nil, fmt.Errorf("failed to parse critical files response: %w (response: %s)", err, response)
	}

	return fileResponse.Files, nil
}

// Stage 2: Deep analysis of critical files
func (g *GeminiClient) GenerateDeepSummary(files map[string]string) (*models.SmartSummary, error) {
	// Build the file contents string
	var filesContent strings.Builder
	for path, content := range files {
		filesContent.WriteString(fmt.Sprintf("\n--- FILE: %s ---\n", path))
		// Truncate very long files to avoid token limits
		if len(content) > 10000 {
			content = content[:10000] + "\n... [truncated]"
		}
		filesContent.WriteString(content)
		filesContent.WriteString("\n")
	}

	prompt := fmt.Sprintf(`You are an expert code analyst AND a professional resume writer. Analyze these critical source files from a software project and generate a comprehensive summary PLUS a LaTeX-formatted resume entry.

%s

Based on your analysis, generate a JSON response with this exact structure:
{
  "archetype": "A short description of the project type (e.g., 'REST API in Go', 'React Dashboard', 'CLI Tool in Python', 'Full-Stack Web App')",
  "one_liner": "A compelling one-sentence description of what this project does and its purpose",
  "key_tech": ["Array", "of", "key", "technologies", "frameworks", "libraries", "detected"],
  "code_quality_score": 7,
  "complexity": "Medium",
  "latex_code": "\\textbf{ProjectName} | 2024 -- \\textbf{Tech:} Go, React, PostgreSQL -- \\textbullet\\ Processed 10K+ daily transactions with 99.9%% reliability -- \\textbullet\\ Implemented caching layer reducing query time by 60%% -- \\textbullet\\ Deployed to production using Docker"
}

Guidelines for archetype and one_liner:
- archetype: Should be concise, like "REST API in Go" or "Next.js Dashboard"
- one_liner: Should be engaging and explain the project's purpose (max 150 chars)
- key_tech: List 5-8 key technologies, frameworks, or patterns detected
- code_quality_score: Rate 1-10 based on code organization, naming, structure, error handling
- complexity: Must be exactly one of "Low", "Medium", or "High"

Guidelines for latex_code (CRITICAL - Must work in standard Overleaf resumes):
- DO NOT use: \\begin{itemize}...\\end{itemize}, itemize options, \\hfill, \\vspace, or enumitem
- DO use: \\textbullet\\ for bullet points (simple text-based bullets)
- Format: One continuous line with simple text structure
- Use \\textbf{} for emphasis, \\texttt{} for code/technical terms, \\textit{} for italics
- Separate bullets with \\textbullet\\ (space-bullet-space pattern)
- Include quantifiable metrics: "2.5K+ users", "50ms response time", "99.9%% uptime"
- Date format: put at the very end on same line (e.g., "| 2024")
- Description: should be brief technical description (30-40 words max)
- Keep bullets concise and impactful (1-2 lines each)
- Output must be a single paragraph that fits in resume layout
- All backslashes must be escaped (\\\\) for JSON
- Structure: ProjectName | Date -- Tech | Bullet1 -- Bullet2 -- Bullet3 -- Bullet4

Example format:
\\textbf{ProjectName} | 2024 -- \\textbf{Tech:} Go, React, PostgreSQL -- \\textbullet\\ Processed 10K+ daily transactions with 99.9%% reliability -- \\textbullet\\ Implemented caching layer reducing query time by 60%% -- \\textbullet\\ Deployed to production using Docker and Kubernetes

Return ONLY the JSON object, no additional text.`, filesContent.String())

	response, err := g.callGemini(geminiProModel, prompt, true)
	if err != nil {
		return nil, fmt.Errorf("Stage 2 failed: %w", err)
	}

	// Clean up the response
	response = strings.TrimPrefix(response, "```json")
	response = strings.TrimPrefix(response, "```")
	response = strings.TrimSuffix(response, "```")
	response = strings.TrimSpace(response)

	var summary models.SmartSummary
	if err := json.Unmarshal([]byte(response), &summary); err != nil {
		return nil, fmt.Errorf("failed to parse summary response: %w (response: %s)", err, response)
	}

	// Validate and sanitize
	if summary.CodeQualityScore < 1 {
		summary.CodeQualityScore = 1
	}
	if summary.CodeQualityScore > 10 {
		summary.CodeQualityScore = 10
	}
	if summary.Complexity != "Low" && summary.Complexity != "Medium" && summary.Complexity != "High" {
		summary.Complexity = "Medium"
	}

	return &summary, nil
}

// GenerateSmartSummary is the main autonomous agent function
func (g *GeminiClient) GenerateSmartSummary(ghClient *github.Client, owner, repo string) (*models.SmartSummary, string, error) {
	stage := "scanning_structure"

	// Stage 1: Fetch and analyze file tree
	fmt.Printf("[Stage 1] Fetching file tree for %s/%s...\n", owner, repo)
	tree, err := ghClient.FetchRepoTree(owner, repo)
	if err != nil {
		return nil, stage, fmt.Errorf("failed to fetch repo tree: %w", err)
	}

	treeString := tree.GetTreeAsString()
	fmt.Printf("[Stage 1] Analyzing %d files to identify critical ones...\n", len(tree.Tree))

	criticalFiles, err := g.IdentifyCriticalFiles(treeString)
	if err != nil {
		return nil, stage, fmt.Errorf("failed to identify critical files: %w", err)
	}
	fmt.Printf("[Stage 1] Identified critical files: %v\n", criticalFiles)

	// Stage 2: Fetch and analyze critical files
	stage = "reading_files"
	fmt.Printf("[Stage 2] Fetching content of %d critical files...\n", len(criticalFiles))

	fileContents, err := ghClient.FetchMultipleFiles(owner, repo, criticalFiles)
	if err != nil {
		return nil, stage, fmt.Errorf("failed to fetch file contents: %w", err)
	}
	fmt.Printf("[Stage 2] Fetched %d files, generating deep summary...\n", len(fileContents))

	summary, err := g.GenerateDeepSummary(fileContents)
	if err != nil {
		return nil, stage, fmt.Errorf("failed to generate summary: %w", err)
	}

	fmt.Printf("[Complete] Generated smart summary for %s/%s\n", owner, repo)
	return summary, "complete", nil
}
