// API client for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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
    throw new ApiError(response.status, `API Error: ${response.statusText}`);
  }

  return response.json();
}

// API functions for each chart type
export const api = {
  // Analyze a repository
  analyzeRepository: async (repoUrl: string) => {
    return fetchAPI("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ repoUrl }),
    });
  },

  // Get language distribution
  getLanguages: async (repoUrl: string) => {
    return fetchAPI(`/api/languages?repo=${encodeURIComponent(repoUrl)}`);
  },

  // Get contributor statistics
  getContributors: async (repoUrl: string) => {
    return fetchAPI(`/api/contributors?repo=${encodeURIComponent(repoUrl)}`);
  },

  // Get project pulse (time-series commits)
  getProjectPulse: async (repoUrl: string) => {
    return fetchAPI(`/api/pulse?repo=${encodeURIComponent(repoUrl)}`);
  },

  // Get heatmap data
  getHeatmapData: async (repoUrl: string) => {
    return fetchAPI(`/api/heatmap?repo=${encodeURIComponent(repoUrl)}`);
  },

  // Get hourly activity
  getHourlyActivity: async (repoUrl: string) => {
    return fetchAPI(`/api/activity?repo=${encodeURIComponent(repoUrl)}`);
  },

  // Get health metrics
  getHealthMetrics: async (repoUrl: string) => {
    return fetchAPI(`/api/metrics?repo=${encodeURIComponent(repoUrl)}`);
  },
};

export default api;
