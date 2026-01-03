// Example of how to make the page interactive with backend integration
// Replace app/page.tsx with this when ready to connect to backend

"use client";

import { useState } from "react";
import LanguagePieChart from "@/components/LanguagePieChart";
import CommitBarChart from "@/components/CommitBarChart";
import ProjectPulseLineChart from "@/components/ProjectPulseLineChart";
import CommitHeatmap from "@/components/CommitHeatmap";
import CommitHistogram from "@/components/CommitHistogram";
import ConsistencyRadarChart from "@/components/ConsistencyRadarChart";
import api from "@/lib/api";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a repository URL");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Call your backend API
      const response = await api.analyzeRepository(repoUrl);
      console.log("Analysis complete:", response);
      setAnalyzed(true);

      // Update each chart component with the data
      // You'll need to pass the data as props to each chart component
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze repository"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Hacker Introspector
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Deep insights into your hackathon repository
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Repository Input Section */}
        <div className="mb-8 bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
          <label
            htmlFor="repo-url"
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
          >
            Repository URL
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              id="repo-url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                Analyzing repository...
              </p>
            </div>
          </div>
        )}

        {/* Charts Grid - Show when analyzed or with dummy data */}
        {(analyzed || !loading) && (
          <div className="space-y-8">
            {/* Row 1: Pie Chart and Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LanguagePieChart />
              <CommitBarChart />
            </div>

            {/* Row 2: Line Chart */}
            <div className="grid grid-cols-1">
              <ProjectPulseLineChart />
            </div>

            {/* Row 3: Heatmap */}
            <div className="grid grid-cols-1">
              <CommitHeatmap />
            </div>

            {/* Row 4: Histogram and Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CommitHistogram />
              <ConsistencyRadarChart />
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12">
        <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>Built for MLH Hack for Hackers 2026</p>
        </div>
      </footer>
    </div>
  );
}
