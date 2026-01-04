package voice

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// ElevenLabsClient handles text-to-speech conversion using ElevenLabs API
type ElevenLabsClient struct {
	apiKey     string
	httpClient *http.Client
}

// NewElevenLabsClient creates a new ElevenLabs client
func NewElevenLabsClient(apiKey string) *ElevenLabsClient {
	return &ElevenLabsClient{
		apiKey:     apiKey,
		httpClient: &http.Client{},
	}
}

// TTSRequest represents a text-to-speech request
type TTSRequest struct {
	Text     string `json:"text"`
	VoiceID  string `json:"voice_id"`
	ModelID  string `json:"model_id"`
}

// TextToSpeech converts text to speech using ElevenLabs
// Returns audio data as bytes
func (e *ElevenLabsClient) TextToSpeech(text string) ([]byte, error) {
	// Use a natural, conversational voice
	voiceID := "21m00Tcm4TlvDq8ikWAM" // Rachel voice - natural and clear
	
	url := fmt.Sprintf("https://api.elevenlabs.io/v1/text-to-speech/%s", voiceID)

	requestBody := map[string]interface{}{
		"text":    text,
		"model_id": "eleven_monolingual_v1",
		"voice_settings": map[string]interface{}{
			"stability":        0.5,
			"similarity_boost": 0.75,
		},
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Accept", "audio/mpeg")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("xi-api-key", e.apiKey)

	resp, err := e.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call ElevenLabs API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ElevenLabs API error (status %d): %s", resp.StatusCode, string(body))
	}

	audioData, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read audio data: %w", err)
	}

	return audioData, nil
}
