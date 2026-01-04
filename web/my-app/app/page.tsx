"use client";

import { useState, useMemo, useCallback } from "react";
import {
  FilterBar,
  StatsGrid,
  ActivitySummary,
  TimeInsights,
  WeekdayChart,
  RecentActivity,
  ContributorsList,
  LanguageBreakdown,
  RepoHeader,
} from "@/components/analytics";
import MoreInsights from "@/components/MoreInsights";
import TalkToRepo from "@/components/TalkToRepo";
import { analyzeRepository } from "@/lib/api";
import {
  AnalyticsReport,
  DatePreset,
  DateRange,
  parseCommitDates,
  getDateRangeFromPreset,
  filterDatesByRange,
  groupCommitsByDay,
  groupCommitsByHour,
  groupCommitsByDayOfWeek,
  processContributors,
  processLanguages,
  calculateProjectStats,
} from "@/types/analytics";

export default function Home() {
  // Core state
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<AnalyticsReport | null>(null);

  // Filter state
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(
    null
  );

  // Parse all commit dates once
  const allDates = useMemo(() => {
    return parseCommitDates(report?.commit_timeline);
  }, [report?.commit_timeline]);

  // Calculate date boundaries
  const minDate = allDates.length > 0 ? allDates[0] : null;
  const maxDate = allDates.length > 0 ? allDates[allDates.length - 1] : null;

  // Calculate effective date range based on preset or custom
  const effectiveDateRange = useMemo(() => {
    if (datePreset === "custom" && customDateRange) {
      return customDateRange;
    }
    return getDateRangeFromPreset(datePreset, allDates);
  }, [datePreset, customDateRange, allDates]);

  // Filter dates by range
  const filteredDates = useMemo(() => {
    return filterDatesByRange(allDates, effectiveDateRange);
  }, [allDates, effectiveDateRange]);

  // Process all data
  const stats = useMemo(() => {
    return calculateProjectStats(report, allDates, filteredDates);
  }, [report, allDates, filteredDates]);

  const commitsByDay = useMemo(() => {
    return groupCommitsByDay(filteredDates);
  }, [filteredDates]);

  const commitsByHour = useMemo(() => {
    return groupCommitsByHour(filteredDates);
  }, [filteredDates]);

  const commitsByDayOfWeek = useMemo(() => {
    return groupCommitsByDayOfWeek(filteredDates);
  }, [filteredDates]);

  const contributors = useMemo(() => {
    return processContributors(report?.contributors);
  }, [report?.contributors]);

  const languages = useMemo(() => {
    return processLanguages(report?.repo_info?.languages);
  }, [report?.repo_info?.languages]);

  // Extract owner/repo for AI insights
  const { owner, repo } = useMemo(() => {
    try {
      const parts = repoUrl.replace(/https?:\/\//, "").split("/");
      if (parts.length >= 3 && parts[0] === "github.com") {
        return { owner: parts[1], repo: parts[2].replace(/\.git$/, "") };
      }
    } catch {
      // ignore
    }
    return { owner: "", repo: "" };
  }, [repoUrl]);

  // Handlers
  const handlePresetChange = useCallback(
    (preset: DatePreset) => {
      setDatePreset(preset);
      if (preset !== "custom") {
        setCustomDateRange(null);
      } else if (minDate && maxDate) {
        setCustomDateRange({ start: minDate, end: maxDate });
      }
    },
    [minDate, maxDate]
  );

  const handleCustomRangeChange = useCallback((range: DateRange) => {
    setDatePreset("custom");
    setCustomDateRange(range);
  }, []);

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a repository URL");
      return;
    }

    if (!repoUrl.includes("github.com")) {
      setError("Please enter a valid GitHub URL");
      return;
    }

    setLoading(true);
    setError("");
    setReport(null);
    setDatePreset("all");
    setCustomDateRange(null);

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-mono">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            HACKER INTROSPECTOR
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
            Deep analytics for your hackathon repository
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 mb-8">
          <label
            htmlFor="repo-url"
            className="block text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-2"
          >
            Repository URL
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              id="repo-url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="https://github.com/owner/repository"
              className="flex-1 px-4 py-3 text-sm font-mono border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-500 disabled:opacity-50"
              disabled={loading}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-8 py-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-400 text-white dark:text-zinc-900 text-sm font-mono font-bold tracking-wider transition-colors min-w-[140px]"
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
                  ANALYZING
                </span>
              ) : (
                "ANALYZE"
              )}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm font-mono text-red-600 dark:text-red-400">
              ✕ {error}
            </p>
          )}
          <p className="mt-3 text-xs font-mono text-zinc-400 dark:text-zinc-600">
            Try: https://github.com/gin-gonic/gin or any public GitHub
            repository
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-2 border-zinc-200 dark:border-zinc-800" />
              <div className="absolute inset-0 border-2 border-transparent border-t-zinc-900 dark:border-t-zinc-100 animate-spin" />
            </div>
            <p className="mt-6 text-sm font-mono text-zinc-500 dark:text-zinc-500">
              Fetching repository data from GitHub...
            </p>
            <p className="mt-2 text-xs font-mono text-zinc-400 dark:text-zinc-600">
              This may take a moment for large repositories
            </p>
          </div>
        )}

        {/* Results */}
        {report && !loading && (
          <div className="space-y-6">
            {/* Repo Header */}
            <RepoHeader repoInfo={report.repo_info} />

            {/* Filter Bar */}
            <FilterBar
              datePreset={datePreset}
              dateRange={effectiveDateRange}
              minDate={minDate}
              maxDate={maxDate}
              totalCommits={stats.totalCommits}
              filteredCommits={stats.filteredCommits}
              onPresetChange={handlePresetChange}
              onCustomRangeChange={handleCustomRangeChange}
            />

            {/* Stats Grid */}
            <StatsGrid stats={stats} />

            {/* Activity Summary - replaces buggy CommitTimeline */}
            <ActivitySummary data={commitsByDay} />

            {/* Recent Activity - replaces buggy ContributionHeatmap */}
            <RecentActivity data={commitsByDay} />

            {/* Two Column Grid: Time Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimeInsights data={commitsByHour} />
              <WeekdayChart data={commitsByDayOfWeek} />
            </div>

            {/* Two Column Grid: Contributors and Languages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ContributorsList
                contributors={contributors}
                totalCommits={stats.filteredCommits}
              />
              <LanguageBreakdown languages={languages} />
            </div>

            {/* AI Insights Section (Unchanged) */}
            <MoreInsights
              repoName={report.repo_info.full_name}
              owner={owner}
              repo={repo}
            />

            {/* Talk to Repo Section */}
            <TalkToRepo owner={owner} repo={repo} />
          </div>
        )}

        {/* Empty State */}
        {!report && !loading && (
          <div className="text-center py-20">
            <div className="inline-block p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 mb-6">
              <svg
                className="w-12 h-12 mx-auto text-zinc-400 dark:text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-mono font-bold text-zinc-700 dark:text-zinc-300 tracking-tight">
              ENTER A REPOSITORY URL TO BEGIN
            </h2>
            <p className="text-sm font-mono text-zinc-500 dark:text-zinc-500 mt-2 max-w-md mx-auto">
              Get deep insights into commit patterns, contributor activity, and
              project health metrics
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12">
        <div className="text-center text-xs font-mono text-zinc-400 dark:text-zinc-600">
          <p>Built for MLH Hack for Hackers 2026</p>
        </div>
      </footer>
    </div>
  );
}
