package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/internal/github"
)

// ChatMessage represents a single message in the conversation
type ChatMessage struct {
	Role    string `json:"role"`    // "user" or "assistant"
	Content string `json:"content"` // The message content
}

// ChatRequest represents the request for chat
type ChatRequest struct {
	Owner   string        `json:"owner"`
	Repo    string        `json:"repo"`
	Files   []string      `json:"files"`   // File paths to discuss
	Message string        `json:"message"` // User's message
	History []ChatMessage `json:"history"` // Previous conversation history
}

// ChatResponse represents the response from chat
type ChatResponse struct {
	Response string `json:"response"` // AI's response
	Error    string `json:"error,omitempty"`
}

// GeminiChatRequest represents the multi-turn chat request for Gemini
type GeminiChatRequest struct {
	Contents         []GeminiChatContent `json:"contents"`
	GenerationConfig GenerationConfig    `json:"generationConfig,omitempty"`
}

type GeminiChatContent struct {
	Role  string `json:"role"` // "user" or "model"
	Parts []Part `json:"parts"`
}

// Chat handles a conversation about specific files
func (g *GeminiClient) Chat(ghClient *github.Client, req *ChatRequest) (*ChatResponse, error) {
	// Fetch file contents
	fileContents, err := ghClient.FetchMultipleFiles(req.Owner, req.Repo, req.Files)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch files: %w", err)
	}

	// Build system context with file contents
	var contextBuilder strings.Builder
	contextBuilder.WriteString("You are a friendly coding mentor chatting with a YOUNG STUDENT who is learning to code.\n\n")
	contextBuilder.WriteString("CRITICAL RULES:\n")
	contextBuilder.WriteString("- Explain in SIMPLE, EASY-TO-UNDERSTAND language\n")
	contextBuilder.WriteString("- NO technical jargon or complex terminology\n")
	contextBuilder.WriteString("- NO code examples or code blocks in your response\n")
	contextBuilder.WriteString("- Use analogies and real-world comparisons\n")
	contextBuilder.WriteString("- Imagine you're explaining to a high school student\n")
	contextBuilder.WriteString("- Be encouraging and positive\n")
	contextBuilder.WriteString("- Keep it conversational and friendly\n")
	contextBuilder.WriteString("- Focus on WHAT the code does, not HOW it's written\n\n")

	contextBuilder.WriteString("Here are the files from the repository:\n\n")

	for path, content := range fileContents {
		contextBuilder.WriteString(fmt.Sprintf("=== FILE: %s ===\n", path))
		// Truncate very long files
		if len(content) > 15000 {
			content = content[:15000] + "\n... [truncated for length]"
		}
		contextBuilder.WriteString(content)
		contextBuilder.WriteString("\n\n")
	}

	contextBuilder.WriteString("\nAnswer the user's questions following the rules above. Be concise, friendly, and conversational.\n")

	// Build the conversation for Gemini
	var contents []GeminiChatContent

	// Add system context as first user message if no history
	if len(req.History) == 0 {
		contents = append(contents, GeminiChatContent{
			Role:  "user",
			Parts: []Part{{Text: contextBuilder.String() + "\n\nUser question: " + req.Message}},
		})
	} else {
		// Add system context
		contents = append(contents, GeminiChatContent{
			Role:  "user",
			Parts: []Part{{Text: contextBuilder.String()}},
		})
		contents = append(contents, GeminiChatContent{
			Role:  "model",
			Parts: []Part{{Text: "I've analyzed the files. I'm ready to help you understand the code. What would you like to know?"}},
		})

		// Add conversation history
		for _, msg := range req.History {
			role := "user"
			if msg.Role == "assistant" {
				role = "model"
			}
			contents = append(contents, GeminiChatContent{
				Role:  role,
				Parts: []Part{{Text: msg.Content}},
			})
		}

		// Add current message
		contents = append(contents, GeminiChatContent{
			Role:  "user",
			Parts: []Part{{Text: req.Message}},
		})
	}

	// Call Gemini API
	response, err := g.callGeminiChat(contents)
	if err != nil {
		return nil, fmt.Errorf("failed to get AI response: %w", err)
	}

	return &ChatResponse{Response: response}, nil
}

// callGeminiChat makes a chat request to Gemini API
func (g *GeminiClient) callGeminiChat(contents []GeminiChatContent) (string, error) {
	url := fmt.Sprintf("%s/%s:generateContent?key=%s", baseURL, geminiFlashModel, g.apiKey)

	reqBody := GeminiChatRequest{
		Contents: contents,
		GenerationConfig: GenerationConfig{
			Temperature:     0.7,
			MaxOutputTokens: 1024, // Allow full, detailed responses
		},
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

// GenerateVoiceResponse generates a response for voice mode (shorter, more conversational)
func (g *GeminiClient) GenerateVoiceResponse(ghClient *github.Client, req *ChatRequest) (*ChatResponse, error) {
	// Fetch file contents
	fileContents, err := ghClient.FetchMultipleFiles(req.Owner, req.Repo, req.Files)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch files: %w", err)
	}

	// Build system context with file contents
	var contextBuilder strings.Builder
	contextBuilder.WriteString("You are an expert code assistant in a VOICE conversation. Keep your responses SHORT and CONVERSATIONAL - as if you're talking to someone on a phone call.\n\n")
	contextBuilder.WriteString("IMPORTANT RULES FOR VOICE RESPONSES:\n")
	contextBuilder.WriteString("- Keep responses under 3-4 sentences\n")
	contextBuilder.WriteString("- Use natural, spoken language (no code blocks, no bullet points)\n")
	contextBuilder.WriteString("- Be concise but friendly\n")
	contextBuilder.WriteString("- Avoid technical jargon unless necessary\n")
	contextBuilder.WriteString("- If explaining code, summarize the key concept briefly\n\n")

	contextBuilder.WriteString("Here are the files being discussed:\n\n")

	for path, content := range fileContents {
		contextBuilder.WriteString(fmt.Sprintf("=== FILE: %s ===\n", path))
		// More aggressive truncation for voice mode
		if len(content) > 8000 {
			content = content[:8000] + "\n... [truncated]"
		}
		contextBuilder.WriteString(content)
		contextBuilder.WriteString("\n\n")
	}

	// Build the conversation for Gemini
	var contents []GeminiChatContent

	if len(req.History) == 0 {
		contents = append(contents, GeminiChatContent{
			Role:  "user",
			Parts: []Part{{Text: contextBuilder.String() + "\n\nUser says: " + req.Message}},
		})
	} else {
		contents = append(contents, GeminiChatContent{
			Role:  "user",
			Parts: []Part{{Text: contextBuilder.String()}},
		})
		contents = append(contents, GeminiChatContent{
			Role:  "model",
			Parts: []Part{{Text: "Got it, I've looked at the files. What would you like to know?"}},
		})

		for _, msg := range req.History {
			role := "user"
			if msg.Role == "assistant" {
				role = "model"
			}
			contents = append(contents, GeminiChatContent{
				Role:  role,
				Parts: []Part{{Text: msg.Content}},
			})
		}

		contents = append(contents, GeminiChatContent{
			Role:  "user",
			Parts: []Part{{Text: req.Message}},
		})
	}

	// Call Gemini API
	response, err := g.callGeminiChat(contents)
	if err != nil {
		return nil, fmt.Errorf("failed to get AI response: %w", err)
	}

	return &ChatResponse{Response: response}, nil
}
