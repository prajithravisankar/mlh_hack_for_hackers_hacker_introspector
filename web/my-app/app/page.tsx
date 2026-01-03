"use client";

import { useState } from "react";
import LanguagePieChart from "@/components/LanguagePieChart";
import CommitBarChart from "@/components/CommitBarChart";
import ProjectPulseLineChart from "@/components/ProjectPulseLineChart";
import CommitHeatmap from "@/components/CommitHeatmap";
import CommitHistogram from "@/components/CommitHistogram";
import ConsistencyRadarChart from "@/components/ConsistencyRadarChart";
import RepoInfoCard from "@/components/RepoInfoCard";
import { analyzeRepository } from "@/lib/api";
import {
  AnalyticsReport,
  transformLanguages,
  transformContributors,
  transformTimeline,
  transformHourlyActivity,
  transformHeatmap,
  calculateHealthMetrics,
} from "@/types/charts";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<AnalyticsReport | null>(null);

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a repository URL");
      return;
    }

    // Basic URL validation
    if (!repoUrl.includes("github.com")) {
      setError("Please enter a valid GitHub URL");
      return;
    }

    setLoading(true);
    setError("");
    setReport(null);

    try {
      const data = await analyzeRepository(repoUrl);
      setReport(data);
    } catch (err) {
      console.error("Analysis error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to analyze repository"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleAnalyze();
    }
  };

  // Transform data for charts
  const languageData = report
    ? transformLanguages(report.repo_info.languages || {})
    : [];
  const contributorData = report
    ? transformContributors(report.contributors || [])
    : [];
  const timelineData = report
    ? transformTimeline(report.commit_timeline || [])
    : [];
  const hourlyData = report
    ? transformHourlyActivity(report.commit_timeline || [])
    : [];
  const heatmapData = report
    ? transformHeatmap(report.commit_timeline || [])
    : [];
  const healthMetrics = report
    ? calculateHealthMetrics(
        report.contributors || [],
        report.commit_timeline || []
      )
    : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            🔍 Hacker Introspector
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
              onKeyPress={handleKeyPress}
              placeholder="https://github.com/username/repository"
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors min-w-[120px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                "Analyze"
              )}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              ⚠️ {error}
            </p>
          )}
          <p className="mt-2 text-xs text-zinc-500">
            Try: https://github.com/gin-gonic/gin or any public GitHub repo
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                Fetching repository data from GitHub...
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                This may take a moment for large repositories
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {report && !loading && (
          <div className="space-y-8">
            {/* Repository Info */}
            <RepoInfoCard repoInfo={report.repo_info} />

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Total Commits
                </p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {report.commit_timeline?.length || 0}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Contributors
                </p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {report.contributors?.length || 0}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Languages
                </p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {Object.keys(report.repo_info.languages || {}).length}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Analyzed
                </p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {new Date(report.generated_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="space-y-8">
              {/* Row 1: Pie Chart and Bar Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LanguagePieChart data={languageData} />
                <CommitBarChart data={contributorData} />
              </div>

              {/* Row 2: Line Chart */}
              <div className="grid grid-cols-1">
                <ProjectPulseLineChart data={timelineData} />
              </div>

              {/* Row 3: Heatmap */}
              <div className="grid grid-cols-1">
                <CommitHeatmap data={heatmapData} />
              </div>

              {/* Row 4: Histogram and Radar Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CommitHistogram data={hourlyData} />
                <ConsistencyRadarChart data={healthMetrics} />
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!report && !loading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">
              Enter a GitHub repository URL to get started
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Get deep insights into commit patterns, contributor activity, and
              project health
            </p>
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
