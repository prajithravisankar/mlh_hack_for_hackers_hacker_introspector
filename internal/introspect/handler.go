package introspect

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/github"
)

type Handler struct {
	repo         *ReportRepository
	githubClient *github.Client
}

func NewHandler(repo *ReportRepository, githubClient *github.Client) *Handler {
	return &Handler{
		repo:         repo,
		githubClient: githubClient,
	}
}

type AnalyzeRequest struct {
	RepoURL   string `json:"repo_url" binding:"required,url"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
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

	// Only check cache if NO dates are provided.
	// If dates are present, we must fetch fresh data to be accurate.
	if req.StartDate == "" && req.EndDate == "" {
		existingReport, err := h.repo.GetReportByRepoName(fullName)
		if err == nil {
			c.JSON(http.StatusOK, existingReport)
			return
		}
	}

	// Fetch fresh data
	report, err := h.githubClient.FetchEverything(owner, repoName, req.StartDate, req.EndDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Save to DB (Only if it's a generic, non-dated report)
	// We don't want to overwrite the "Master" report with a partial date-filtered one.
	if req.StartDate == "" && req.EndDate == "" {
		if err := h.repo.SaveReport(report); err != nil {
			fmt.Println("Error saving to DB:", err)
		}
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
