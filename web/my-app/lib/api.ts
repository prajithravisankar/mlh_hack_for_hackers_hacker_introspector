// API client for backend communication
import { AnalyticsReport } from "@/types/analytics";

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:8080";

// SmartSummary type matching the Go struct
export interface SmartSummary {
  archetype: string;
  one_liner: string;
  key_tech: string[];
  code_quality_score: number;
  complexity: "Low" | "Medium" | "High";
  latex_code: string;
}

// FileNode type for file tree structure
export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

// FileTree response from API
export interface FileTreeResponse {
  tree: FileNode[];
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      response.status,
      errorText || `API Error: ${response.statusText}`
    );
  }

  return response.json();
}

// Main API function - matches the backend endpoint
export async function analyzeRepository(
  repoUrl: string
): Promise<AnalyticsReport> {
  return fetchAPI<AnalyticsReport>("/api/analyze", {
    method: "POST",
    body: JSON.stringify({ repo_url: repoUrl }), // Match backend's expected field name
  });
}

// Get cached report by owner/repo
export async function getReport(
  owner: string,
  repo: string
): Promise<AnalyticsReport> {
  return fetchAPI<AnalyticsReport>(`/api/report/${owner}/${repo}`);
}

// Generate AI-powered smart summary
export async function generateSmartSummary(
  owner: string,
  repo: string
): Promise<SmartSummary> {
  return fetchAPI<SmartSummary>("/api/smart-summary", {
    method: "POST",
    body: JSON.stringify({ owner, repo }),
  });
}

// Fetch repository file tree
export async function fetchFileTree(
  owner: string,
  repo: string
): Promise<FileNode[]> {
  const response = await fetchAPI<FileTreeResponse>("/api/file-tree", {
    method: "POST",
    body: JSON.stringify({ owner, repo }),
  });
  return response.tree;
}

// Chat message type
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Chat response type
export interface ChatResponse {
  response: string;
  error?: string;
}

// Voice chat response type
export interface VoiceChatResponse {
  response: string;
  audio?: string; // base64 encoded audio
  audio_error?: string;
}

// Chat with repo
export async function chatWithRepo(
  owner: string,
  repo: string,
  files: string[],
  message: string,
  history: ChatMessage[] = []
): Promise<ChatResponse> {
  return fetchAPI<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ owner, repo, files, message, history }),
  });
}

// Voice chat with repo
export async function voiceChatWithRepo(
  owner: string,
  repo: string,
  files: string[],
  message: string,
  history: ChatMessage[] = []
): Promise<VoiceChatResponse> {
  return fetchAPI<VoiceChatResponse>("/api/voice-chat", {
    method: "POST",
    body: JSON.stringify({ owner, repo, files, message, history }),
  });
}

// Start voice call with greeting
export async function startVoiceCall(
  owner: string,
  repo: string,
  files: string[]
): Promise<VoiceChatResponse> {
  const greeting = `Hi! I'm ready to discuss the ${files.length} file${
    files.length > 1 ? "s" : ""
  } you selected. What would you like to know about the code?`;
  return voiceChatWithRepo(owner, repo, files, greeting, []);
}

export const api = {
  analyzeRepository,
  getReport,
  generateSmartSummary,
  fetchFileTree,
  chatWithRepo,
  voiceChatWithRepo,
  startVoiceCall,
};

export default api;
