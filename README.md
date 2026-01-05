![mlh_hack_for_hackers_hacker_introspector](https://socialify.git.ci/prajithravisankar/mlh_hack_for_hackers_hacker_introspector/image?custom_language=Go&description=1&font=JetBrains+Mono&language=1&name=1&owner=1&pattern=Solid&stargazers=1&theme=Dark)

# Hacker Introspector

> **AI-Powered GitHub Repository Analytics & Voice Conversation Platform** Built with Google Gemini, Eleven Labs, and Vultr

https://github.com/user-attachments/assets/b27c50a1-f266-4890-ba7b-6f83ff91cbc9


Built for **MLH Hack for Hackers 2026** 🏆

[![Go](https://img.shields.io/badge/Go-1.25-00ADD8?style=flat&logo=go)](https://golang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-TTS-000000?style=flat)](https://elevenlabs.io/)
[![Vultr](https://img.shields.io/badge/Vultr-TTS-000000?style=flat)](https://www.vultr.com/promo/try250?service=try250&utm_source=google-na-brand&utm_medium=paidmedia&obility_id=42460259882&utm_campaign=NA_-_Search_-_Vultr_Branded_-_1009&utm_term=vultr%20vps&utm_content=665882116752&gad_source=1&gad_campaignid=780450717&gbraid=0AAAAADMuDjDFYO5p25Bl6OeHSBFGBn34q&gclid=Cj0KCQiAvOjKBhC9ARIsAFvz5ljs-zYeq5Wt3p9dEHhQzRS_wrjLfY6xCFvIj19aAa3TEC7RQV02hVQaAg9uEALw_wcB)
---

## Features

### Repository Analytics
- **Deep GitHub Analysis** - Analyze any public GitHub repository
- **Commit Heatmaps** - Visualize contribution patterns over time
- **Language Breakdown** - See tech stack distribution with interactive pie charts
- **Contributor Insights** - Understand who's driving the project
- **Code Quality Scoring** - AI-powered assessment of code health

### AI-Powered Smart Summary
- **Project Archetype Detection** - Automatically categorize repos (Web App, CLI Tool, Library, etc.)
- **One-liner Descriptions** - Get concise project summaries
- **Key Technology Extraction** - Identify core technologies and frameworks
- **Complexity Analysis** - Low/Medium/High complexity ratings

### Talk to Your Repo (Chat Mode)
- Select up to **10 files** from any repository
- Have natural conversations about the code
- Get explanations, suggestions, and insights
- Conversation history maintained throughout session

### Voice Conversation (NEW!)
- **Real-time voice calls** with AI about your code
- Speech-to-text using Web Speech API
- Natural voice responses via **ElevenLabs TTS**
- Interactive back-and-forth conversation flow
- The AI asks follow-up questions to guide learning

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                     │
│                    Deployed on Vercel                        │
├─────────────────────────────────────────────────────────────┤
│  • React 19 with TypeScript                                  │
│  • Tailwind CSS + Framer Motion                             │
│  • Recharts for data visualization                          │
│  • Web Speech API for voice recognition                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ REST API
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Go + Gin)                        │
│                    Deployed on Vultr VPS                     │
├─────────────────────────────────────────────────────────────┤
│  • Gin web framework with CORS                              │
│  • SQLite for caching                                       │
│  • GitHub API integration                                   │
│  • Gemini AI for analysis & chat                            │
│  • ElevenLabs for text-to-speech                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
hacker_introspector/
├── cmd/
│   └── server/
│       └── main.go          # Entry point - initializes all services
├── internal/
│   ├── ai/
│   │   ├── gemini.go        # Gemini AI client (chat, summaries)
│   │   ├── chat.go          # Voice-optimized chat responses
│   │   └── elevenlabs.go    # ElevenLabs TTS integration
│   ├── db/
│   │   └── db.go            # SQLite database setup
│   ├── github/
│   │   ├── client.go        # GitHub API client
│   │   └── service.go       # Repository data fetching
│   ├── introspect/
│   │   ├── handler.go       # HTTP request handlers
│   │   └── repository.go    # Database operations
│   ├── models/
│   │   └── model.go         # Data structures
│   └── voice/
│       ├── handler.go       # Voice conversation handler
│       └── elevenlabs.go    # TTS client
├── web/
│   └── my-app/              # Next.js frontend
│       ├── app/             # App router pages
│       ├── components/      # React components
│       │   ├── TalkToRepo.tsx
│       │   ├── FileTree.tsx
│       │   ├── SmartSummaryCard.tsx
│       │   ├── CommitHeatmap.tsx
│       │   └── ...
│       ├── lib/
│       │   └── api.ts       # API client
│       └── types/
│           └── analytics.ts # TypeScript types
├── Dockerfile               # Docker build for backend
├── .dockerignore            # Excludes frontend from Docker
├── go.mod                   # Go dependencies
└── go.sum
```

---

## 🚀 Getting Started

### Prerequisites

- **Go 1.25+**
- **Node.js 20+** with pnpm
- **GitHub Personal Access Token**
- **Gemini API Key** (free tier available)
- **ElevenLabs API Key** (for voice features)

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Required
GITHUB_TOKEN=ghp_your_github_token
GEMINI_API_KEY=your_gemini_api_key

# Optional (for voice features)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

Create a `.env.local` file in `web/my-app/`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Running Locally

#### Backend (Go)

```bash
# From root directory
go mod download
go run ./cmd/server/main.go

# Server starts on http://localhost:8080
```

#### Frontend (Next.js)

```bash
cd web/my-app
pnpm install
pnpm dev

# Frontend starts on http://localhost:3000
```

---

## 🐳 Docker Deployment

### Build & Run Backend

```bash
# Build the image
docker build -t hacker-introspector .

# Run with environment variables
docker run -p 8080:8080 \
  -e GITHUB_TOKEN=your_token \
  -e GEMINI_API_KEY=your_key \
  -e ELEVENLABS_API_KEY=your_key \
  hacker-introspector
```

### Deploy Frontend to Vercel

```bash
cd web/my-app
vercel --prod
```

Set `NEXT_PUBLIC_API_URL` to your backend URL in Vercel environment variables.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/ping` | Health check |
| `POST` | `/api/analyze` | Analyze a GitHub repository |
| `GET` | `/api/report/:owner/:repo` | Get cached analysis report |
| `POST` | `/api/smart-summary` | Generate AI summary |
| `POST` | `/api/file-tree` | Get repository file tree |
| `POST` | `/api/chat` | Chat about selected files |
| `POST` | `/api/voice-chat` | Voice chat with TTS response |

### Example: Analyze a Repository

```bash
curl -X POST http://localhost:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/facebook/react"}'
```

---

## 🎤 Voice Conversation Feature

The voice feature enables real-time spoken conversations about code:

1. **Select Files** - Choose up to 10 files from the repo
2. **Start Call** - Click "Talk" mode
3. **Speak** - Tap the mic and ask questions
4. **Listen** - AI responds with natural voice (ElevenLabs)
5. **Continue** - AI asks follow-up questions

**Technical Flow:**
```
User Speech → Web Speech API → Text → Gemini AI → Response → ElevenLabs TTS → Audio
```

See [VOICE_SETUP_GUIDE.md](./VOICE_SETUP_GUIDE.md) for detailed setup instructions.

---

## 🛠️ Tech Stack

### Backend
- **Go 1.25** - High-performance server
- **Gin** - Web framework
- **GORM + SQLite** - Database ORM
- **Gemini 2.5 Flash Lite** - AI model (free tier)
- **ElevenLabs** - Text-to-speech

### Frontend
- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Lucide Icons** - Icon library

---

## 📄 License

MIT License - Built with ❤️ for MLH Hack for Hackers 2026

---

## 👨‍💻 Author

**Prajith Ravisankar**

- GitHub: [@prajithravisankar](https://github.com/prajithravisankar)

---

## 🙏 Acknowledgments

- [MLH](https://mlh.io/) - For hosting Hack for Hackers
- [Google Gemini](https://ai.google.dev/) - AI capabilities
- [ElevenLabs](https://elevenlabs.io/) - Voice synthesis
- [Vercel](https://vercel.com/) - Frontend hosting
- [Vultr](https://www.vultr.com/) - Backend hosting
