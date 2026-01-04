package voice

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/ai"
	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/github"
)

// Handler handles voice conversation requests
type Handler struct {
	geminiClient     *ai.GeminiClient
	elevenlabsClient *ElevenLabsClient
	githubClient     *github.Client
}

// NewHandler creates a new voice handler
func NewHandler(geminiClient *ai.GeminiClient, elevenlabsClient *ElevenLabsClient, githubClient *github.Client) *Handler {
	return &Handler{
		geminiClient:     geminiClient,
		elevenlabsClient: elevenlabsClient,
		githubClient:     githubClient,
	}
}

// VoiceRequest represents a voice conversation request
type VoiceRequest struct {
	Owner       string           `json:"owner"`
	Repo        string           `json:"repo"`
	Files       []string         `json:"files"`
	UserMessage string           `json:"userMessage"`
	History     []ai.ChatMessage `json:"history"`
	IsFirstCall bool             `json:"isFirstCall"`
}

// VoiceResponse represents a voice conversation response
type VoiceResponse struct {
	TextResponse string `json:"textResponse"`
	AudioBase64  string `json:"audioBase64,omitempty"`
	Error        string `json:"error,omitempty"`
}

// HandleVoiceConversation handles a voice conversation turn
func (h *Handler) HandleVoiceConversation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req VoiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Failed to decode request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Generate text response using Gemini
	chatReq := &ai.ChatRequest{
		Owner:   req.Owner,
		Repo:    req.Repo,
		Files:   req.Files,
		Message: req.UserMessage,
		History: req.History,
	}

	// Use voice-optimized response generation
	chatResp, err := h.geminiClient.GenerateVoiceResponse(h.githubClient, chatReq)
	if err != nil {
		log.Printf("Failed to generate AI response: %v", err)
		json.NewEncoder(w).Encode(VoiceResponse{
			Error: fmt.Sprintf("Failed to generate response: %v", err),
		})
		return
	}

	// Convert text to speech using ElevenLabs
	audioData, err := h.elevenlabsClient.TextToSpeech(chatResp.Response)
	if err != nil {
		log.Printf("Failed to convert text to speech: %v", err)
		// Return text response even if TTS fails
		json.NewEncoder(w).Encode(VoiceResponse{
			TextResponse: chatResp.Response,
			Error:        "Audio generation failed, text response only",
		})
		return
	}

	// Convert audio to base64
	audioBase64 := encodeBase64(audioData)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(VoiceResponse{
		TextResponse: chatResp.Response,
		AudioBase64:  audioBase64,
	})
}

// encodeBase64 encodes bytes to base64 string
func encodeBase64(data []byte) string {
	encoded := base64.StdEncoding.EncodeToString(data)
	return fmt.Sprintf("data:audio/mpeg;base64,%s", encoded)
}
