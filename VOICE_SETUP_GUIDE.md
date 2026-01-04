# ElevenLabs Voice Call Setup Guide

# Voice Conversation Feature - FULLY IMPLEMENTED ✅

## Overview

Real-time voice conversation with an AI coding mentor is now **fully functional**!

The system uses:

- **Gemini AI** - For intelligent, conversational responses about code
- **ElevenLabs TTS** - For natural, human-like voice output
- **Web Speech API** - For browser-based speech recognition

## How to Use

### 1. Start a Voice Call

1. Navigate to "Talk to the Repo" section
2. Select up to 3 files from the file tree
3. Click the arrow button → Select "Talk" mode
4. The AI will greet you and ask what you'd like to know

### 2. Have a Conversation

- **Tap the mic button** to start speaking
- Your speech is transcribed in real-time
- The AI responds with voice + text
- The AI asks follow-up questions to keep the conversation going
- Keep talking as long as you like!

### 3. End the Call

- Click the red phone button to end the call anytime
- Or switch to "Chat Mode" for text-based conversation

## Features

- 🎙️ **Live Transcription** - See your words as you speak
- 🔊 **Natural Voice** - ElevenLabs provides human-like speech
- 💬 **Conversation History** - Full transcript in chat bubbles
- 🔇 **Mute/Unmute** - Control your microphone
- 🔈 **Speaker Toggle** - Mute AI audio if needed
- ⏱️ **Call Timer** - Track conversation duration

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Next.js)                 │
├─────────────────────────────────────────────────────────────┤
│  Web Speech API                    Audio Playback            │
│  ├─ SpeechRecognition ──────────► Transcript                 │
│  └─ onresult event                                           │
│                                                              │
│  User Speaks → Transcript → API Call → AI Response → Audio   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Go/Gin)                         │
├─────────────────────────────────────────────────────────────┤
│  POST /api/voice-chat                                        │
│  ├─ Receives: owner, repo, files, message, history           │
│  ├─ Fetches file contents from GitHub                        │
│  ├─ Calls Gemini with voice-optimized prompt                 │
│  ├─ Calls ElevenLabs TTS with response text                  │
│  └─ Returns: { response: string, audio: base64 }             │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│   Gemini AI API     │         │  ElevenLabs TTS     │
├─────────────────────┤         ├─────────────────────┤
│ - Voice-optimized   │         │ - eleven_multilingual│
│   prompts           │         │   _v2 model         │
│ - Short, natural    │         │ - George voice      │
│   responses         │         │   (professional)    │
│ - Follow-up         │         │ - Base64 audio      │
│   questions         │         │   output            │
└─────────────────────┘         └─────────────────────┘
```

---

## Setup Requirements

### Environment Variables

Add these to your `.env` file:

```bash
# Required for voice feature
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Already required
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_here
```

### Get Your ElevenLabs API Key

1. Go to https://elevenlabs.io
2. Sign up / Log in
3. Go to Profile Settings → API Keys
4. Generate a new API key
5. Copy and add to `.env` file

---

## Backend Implementation

### Voice Chat Handler (`internal/introspect/handler.go`)

```go
// VoiceChatWithRepo handles voice conversations - returns text + audio
func (h *Handler) VoiceChatWithRepo(c *gin.Context) {
    var req VoiceChatRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "..."})
        return
    }

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
        c.JSON(http.StatusOK, gin.H{
            "response":    response.Response,
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
```

### Voice-Optimized Gemini Prompt (`internal/ai/chat.go`)

The `GenerateVoiceResponse` function uses a special prompt:

```go
contextBuilder.WriteString("You are a FRIENDLY AI coding mentor having a REAL-TIME VOICE CONVERSATION...\n")
contextBuilder.WriteString("CRITICAL VOICE CONVERSATION RULES:\n")
contextBuilder.WriteString("1. Keep responses SHORT - 2-3 sentences MAXIMUM\n")
contextBuilder.WriteString("2. Use NATURAL spoken language - like a phone call with a friend\n")
contextBuilder.WriteString("3. Be WARM, encouraging, and supportive\n")
contextBuilder.WriteString("4. NEVER use code blocks, bullet points, or markdown\n")
contextBuilder.WriteString("5. ALWAYS end with a follow-up question\n")
// ... etc
```

---

## Frontend Implementation

### Key Components in `TalkToRepo.tsx`

1. **Speech Recognition Setup**

```tsx
const initSpeechRecognition = useCallback(() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  // ... event handlers
  return recognition;
}, []);
```

2. **Voice Conversation State**

```tsx
const [voiceHistory, setVoiceHistory] = useState<ChatMessage[]>([]);
const [isAISpeaking, setIsAISpeaking] = useState(false);
const [isListening, setIsListening] = useState(false);
const [currentTranscript, setCurrentTranscript] = useState("");
const [voiceStatus, setVoiceStatus] = useState("Ready to start");
```

3. **Audio Playback**

```tsx
<audio ref={audioRef} className="hidden" />;

// In handleUserSpeech:
const audioSrc = `data:audio/mpeg;base64,${response.audio}`;
audioRef.current.src = audioSrc;
audioRef.current.onended = () => {
  setIsAISpeaking(false);
  // Auto-start listening after AI finishes
  setTimeout(() => startListening(), 500);
};
await audioRef.current.play();
```

---

## Browser Compatibility

| Browser | Speech Recognition | Audio Playback  |
| ------- | ------------------ | --------------- |
| Chrome  | ✅ Full support    | ✅ Full support |
| Edge    | ✅ Full support    | ✅ Full support |
| Firefox | ❌ Limited         | ✅ Full support |
| Safari  | ⚠️ webkit prefix   | ✅ Full support |

**Note:** For the best experience, use Chrome or Edge.

---

## Troubleshooting

### "Speech recognition not supported"

- Use Chrome or Edge browser
- Make sure you're on HTTPS (required for speech recognition)

### No audio playing

- Check that speaker is not muted (speaker button)
- Check browser's audio permissions
- Verify ELEVENLABS_API_KEY is set correctly

### AI not responding

- Check backend logs for errors
- Verify GEMINI_API_KEY is set correctly
- Ensure files are selected before starting call

### Microphone not working

- Allow microphone access when browser prompts
- Check that mic is not muted (mic button)
- Try refreshing the page

---

## Customization

### Change AI Voice

In `internal/ai/elevenlabs.go`, change the `defaultVoiceID`:

```go
const (
    // Available voices:
    // "JBFqnCBsd6RMkjVDRZzb" - George (professional male)
    // "21m00Tcm4TlvDq8ikWAM" - Rachel (natural female)
    // "EXAVITQu4vr4xnSDxMaL" - Bella (soft female)
    // "ErXwobaYiN019PkySvjV" - Antoni (warm male)
    defaultVoiceID = "JBFqnCBsd6RMkjVDRZzb"
)
```

### Adjust Response Length

In `internal/ai/chat.go`, modify the `GenerationConfig`:

```go
GenerationConfig: GenerationConfig{
    Temperature:     0.7,
    MaxOutputTokens: 200, // Shorter for voice
},
```
