package introspect

import (
	"encoding/base64"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/ai"
	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/github"
)

type Handler struct {
	repo            *ReportRepository
	githubClient    *github.Client
	geminiClient    *ai.GeminiClient
	elevenLabsClient *ai.ElevenLabsClient
}

func NewHandler(repo *ReportRepository, githubClient *github.Client, geminiClient *ai.GeminiClient, elevenLabsClient *ai.ElevenLabsClient) *Handler {
	return &Handler{
		repo:            repo,
		githubClient:    githubClient,
		geminiClient:    geminiClient,
		elevenLabsClient: elevenLabsClient,
	}
}

type AnalyzeRequest struct {
	RepoURL string `json:"repo_url" binding:"required,url"`
}

type SmartSummaryRequest struct {
	Owner string `json:"owner" binding:"required"`
	Repo  string `json:"repo" binding:"required"`
}

// AnalyzeRepo handles the analysis of a repository
func (h *Handler) AnalyzeRepo(c *gin.Context) {
	var req AnalyzeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid URL provided"})
		return
	}

	owner, repoName, err := github.ExtractOwnerAndRepo(req.RepoURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid GitHub URL format"})
		return
	}

	fullName := owner + "/" + repoName

	// Check cache first
	existingReport, err := h.repo.GetReportByRepoName(fullName)
	if err == nil {
		fmt.Println("Returning cached report for", fullName)
		c.JSON(http.StatusOK, existingReport)
		return
	}

	// Fetch fresh data (fetches ALL commits with pagination)
	fmt.Println("Fetching fresh data for", fullName)
	report, err := h.githubClient.FetchEverything(owner, repoName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Save to DB
	if err := h.repo.SaveReport(report); err != nil {
		fmt.Println("Error saving to DB:", err)
	}

	c.JSON(http.StatusOK, report)
}

func (h *Handler) GetReport(c *gin.Context) {
	owner := c.Param("owner")
	repoName := c.Param("repo")
	fullName := owner + "/" + repoName

	report, err := h.repo.GetReportByRepoName(fullName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
		return
	}

	c.JSON(http.StatusOK, report)
}

// SmartSummary generates an AI-powered summary of the repository
func (h *Handler) SmartSummary(c *gin.Context) {
	var req SmartSummaryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request. Required: owner and repo"})
		return
	}

	fmt.Printf("Generating smart summary for %s/%s...\n", req.Owner, req.Repo)

	summary, stage, err := h.geminiClient.GenerateSmartSummary(h.githubClient, req.Owner, req.Repo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
			"stage": stage,
		})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// FileTreeRequest represents the request for fetching file tree
type FileTreeRequest struct {
	Owner string `json:"owner" binding:"required"`
	Repo  string `json:"repo" binding:"required"`
}

// GetFileTree fetches the file tree structure of a repository
func (h *Handler) GetFileTree(c *gin.Context) {
	var req FileTreeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request. Required: owner and repo"})
		return
	}

	fmt.Printf("Fetching file tree for %s/%s...\n", req.Owner, req.Repo)

	fileTree, err := h.githubClient.FetchFileTree(req.Owner, req.Repo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tree": fileTree,
	})
}

// ChatWithRepoRequest represents the request for chatting about repo files
type ChatWithRepoRequest struct {
	Owner   string           `json:"owner" binding:"required"`
	Repo    string           `json:"repo" binding:"required"`
	Files   []string         `json:"files" binding:"required"`
	Message string           `json:"message" binding:"required"`
	History []ai.ChatMessage `json:"history"`
}

// ChatWithRepo handles chat conversations about specific files
func (h *Handler) ChatWithRepo(c *gin.Context) {
	var req ChatWithRepoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request. Required: owner, repo, files, message"})
		return
	}

	if len(req.Files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one file must be selected"})
		return
	}

	if len(req.Files) > 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum 3 files allowed"})
		return
	}

	fmt.Printf("Chat request for %s/%s with %d files: %v\n", req.Owner, req.Repo, len(req.Files), req.Files)

	chatReq := &ai.ChatRequest{
		Owner:   req.Owner,
		Repo:    req.Repo,
		Files:   req.Files,
		Message: req.Message,
		History: req.History,
	}

	response, err := h.geminiClient.Chat(h.githubClient, chatReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// VoiceChatRequest represents the request for voice chat
type VoiceChatRequest struct {
	Owner   string           `json:"owner" binding:"required"`
	Repo    string           `json:"repo" binding:"required"`
	Files   []string         `json:"files" binding:"required"`
	Message string           `json:"message" binding:"required"`
	History []ai.ChatMessage `json:"history"`
}

// VoiceChatWithRepo handles voice conversations - returns text + audio
func (h *Handler) VoiceChatWithRepo(c *gin.Context) {
	var req VoiceChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request. Required: owner, repo, files, message"})
		return
	}

	if len(req.Files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one file must be selected"})
		return
	}

	if len(req.Files) > 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum 3 files allowed"})
		return
	}

	fmt.Printf("Voice chat request for %s/%s with %d files\n", req.Owner, req.Repo, len(req.Files))

	// Get AI response (shorter for voice)
	chatReq := &ai.ChatRequest{
		Owner:   req.Owner,
		Repo:    req.Repo,
		Files:   req.Files,
		Message: req.Message,
		History: req.History,
	}

	response, err := h.geminiClient.GenerateVoiceResponse(h.githubClient, chatReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to speech
	audioData, err := h.elevenLabsClient.TextToSpeech(response.Response)
	if err != nil {
		// Return text response even if TTS fails
		fmt.Printf("TTS failed: %v, returning text only\n", err)
		c.JSON(http.StatusOK, gin.H{
			"response":   response.Response,
			"audio":      nil,
			"audio_error": err.Error(),
		})
		return
	}

	// Return both text and base64-encoded audio
	audioBase64 := base64.StdEncoding.EncodeToString(audioData)

	c.JSON(http.StatusOK, gin.H{
		"response": response.Response,
		"audio":    audioBase64,
	})
}
