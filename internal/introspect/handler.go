package introspect

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/github"
)

type Handler struct {
	repo *ReportRepository
	githubClient *github.Client
}

func NewHandler(repo *ReportRepository, githubClient *github.Client) *Handler {
	return &Handler{
		repo: repo,
		githubClient: githubClient,
	}
}

type AnalyzeRequest struct {
	RepoURL string `json:"repo_url" binding:"required,url"`
}

func (h *Handler) AnalyzeRepo(context *gin.Context) {
	var req AnalyzeRequest

	if err := context.ShouldBindJSON(&req); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid URL provided",
		})

		return
	}

	context.JSON(http.StatusOK, gin.H{
		"message": "Analysis started for " + req.RepoURL,
	})
}

func (h *Handler) GetReport(context *gin.Context) {
	owner := context.Param("owner")
	repoName := context.Param("repo")
	fullName := owner + "/" + repoName

	report, err := h.repo.GetReportByRepoName(fullName)
	if err != nil {
		context.JSON(http.StatusNotFound, gin.H{
			"error": "report not found",
		})

		return
	}

	context.JSON(http.StatusOK, report)
}
