package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

const (
	elevenLabsBaseURL = "https://api.elevenlabs.io/v1"
	// George - Professional male voice, great for explanations
	defaultVoiceID = "JBFqnCBsd6RMkjVDRZzb"
)

// ElevenLabsClient handles text-to-speech conversion
type ElevenLabsClient struct {
	apiKey     string
	httpClient *http.Client
}

// TTSRequest represents the request to ElevenLabs TTS API
type TTSRequest struct {
	Text          string        `json:"text"`
	ModelID       string        `json:"model_id"`
	VoiceSettings VoiceSettings `json:"voice_settings,omitempty"`
}

// VoiceSettings for ElevenLabs
type VoiceSettings struct {
	Stability       float64 `json:"stability"`
	SimilarityBoost float64 `json:"similarity_boost"`
	Style           float64 `json:"style,omitempty"`
	UseSpeakerBoost bool    `json:"use_speaker_boost,omitempty"`
}

// NewElevenLabsClient creates a new ElevenLabs client
func NewElevenLabsClient() *ElevenLabsClient {
	return &ElevenLabsClient{
		apiKey:     os.Getenv("ELEVENLABS_API_KEY"),
		httpClient: &http.Client{},
	}
}

// TextToSpeech converts text to audio and returns the audio bytes
func (e *ElevenLabsClient) TextToSpeech(text string) ([]byte, error) {
	return e.TextToSpeechWithVoice(text, defaultVoiceID)
}

// TextToSpeechWithVoice converts text to audio with a specific voice
func (e *ElevenLabsClient) TextToSpeechWithVoice(text, voiceID string) ([]byte, error) {
	if e.apiKey == "" {
		return nil, fmt.Errorf("ELEVENLABS_API_KEY not set")
	}

	url := fmt.Sprintf("%s/text-to-speech/%s", elevenLabsBaseURL, voiceID)

	reqBody := TTSRequest{
		Text:    text,
		ModelID: "eleven_multilingual_v2",
		VoiceSettings: VoiceSettings{
			Stability:       0.5,
			SimilarityBoost: 0.75,
			Style:           0.0,
			UseSpeakerBoost: true,
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("xi-api-key", e.apiKey)
	req.Header.Set("Accept", "audio/mpeg")

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
		return nil, fmt.Errorf("failed to read audio response: %w", err)
	}

	return audioData, nil
}

// StreamTextToSpeech returns the audio as a stream (for large responses)
func (e *ElevenLabsClient) StreamTextToSpeech(text, voiceID string) (io.ReadCloser, error) {
	if e.apiKey == "" {
		return nil, fmt.Errorf("ELEVENLABS_API_KEY not set")
	}

	url := fmt.Sprintf("%s/text-to-speech/%s/stream", elevenLabsBaseURL, voiceID)

	reqBody := TTSRequest{
		Text:    text,
		ModelID: "eleven_multilingual_v2",
		VoiceSettings: VoiceSettings{
			Stability:       0.5,
			SimilarityBoost: 0.75,
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("xi-api-key", e.apiKey)
	req.Header.Set("Accept", "audio/mpeg")

	resp, err := e.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call ElevenLabs API: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		return nil, fmt.Errorf("ElevenLabs API error (status %d): %s", resp.StatusCode, string(body))
	}

	return resp.Body, nil
}
