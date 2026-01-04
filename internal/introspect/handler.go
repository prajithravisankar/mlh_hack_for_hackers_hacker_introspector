package introspect

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/ai"
	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/github"
)

type Handler struct {
	repo         *ReportRepository
	githubClient *github.Client
	geminiClient *ai.GeminiClient
}

func NewHandler(repo *ReportRepository, githubClient *github.Client, geminiClient *ai.GeminiClient) *Handler {
	return &Handler{
		repo:         repo,
		githubClient: githubClient,
		geminiClient: geminiClient,
	}
}

type AnalyzeRequest struct {
	RepoURL string `json:"repo_url" binding:"required,url"`
}

type SmartSummaryRequest struct {
	Owner string `json:"owner" binding:"required"`
	Repo  string `json:"repo" binding:"required"`
}

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

	// Fetch fresh data (always fetches last 100 commits)
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
