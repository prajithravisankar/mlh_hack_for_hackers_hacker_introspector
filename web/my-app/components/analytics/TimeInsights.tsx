"use client";

import { useMemo } from "react";
import { CommitHour, formatNumber } from "@/types/analytics";

interface Props {
  data: CommitHour[];
}

export default function TimeInsights({ data }: Props) {
  const insights = useMemo(() => {
    const totalCommits = data.reduce((sum, d) => sum + d.count, 0);
    if (totalCommits === 0) return null;

    // Find peak hour
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const peak = sorted[0];
    const top3 = sorted.slice(0, 3).filter((h) => h.count > 0);

    // Morning (6-12), Afternoon (12-18), Evening (18-24), Night (0-6)
    const periods = {
      night: data.slice(0, 6).reduce((s, d) => s + d.count, 0),
      morning: data.slice(6, 12).reduce((s, d) => s + d.count, 0),
      afternoon: data.slice(12, 18).reduce((s, d) => s + d.count, 0),
      evening: data.slice(18, 24).reduce((s, d) => s + d.count, 0),
    };

    // Find dominant period
    const periodEntries = Object.entries(periods) as [string, number][];
    const dominantPeriod = periodEntries.reduce((max, curr) =>
      curr[1] > max[1] ? curr : max
    );

    // Work hours (9-17) vs off hours
    const workHours = data.slice(9, 17).reduce((s, d) => s + d.count, 0);
    const offHours = totalCommits - workHours;

    return {
      peak,
      top3,
      periods,
      dominantPeriod: dominantPeriod[0],
      dominantCount: dominantPeriod[1],
      workHours,
      offHours,
      workHoursPercent: ((workHours / totalCommits) * 100).toFixed(0),
      totalCommits,
    };
  }, [data]);

  const periodLabels: Record<string, string> = {
    night: "🌙 Night Owl (12AM-6AM)",
    morning: "🌅 Early Bird (6AM-12PM)",
    afternoon: "☀️ Afternoon (12PM-6PM)",
    evening: "🌆 Evening (6PM-12AM)",
  };

  if (!insights) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-4">
          Time Insights (UTC)
        </h3>
        <div className="h-40 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-mono text-sm">
          No commit data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
      <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-6">
        Time Insights (UTC)
      </h3>

      {/* Peak Hour */}
      <div className="mb-6">
        <p className="text-xs font-mono text-zinc-400 dark:text-zinc-600 mb-2">
          MOST ACTIVE HOUR
        </p>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {insights.peak.label}
          </span>
          <span className="text-sm font-mono text-zinc-500 dark:text-zinc-500">
            {formatNumber(insights.peak.count)} commits (
            {((insights.peak.count / insights.totalCommits) * 100).toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Time Period Breakdown */}
      <div className="mb-6">
        <p className="text-xs font-mono text-zinc-400 dark:text-zinc-600 mb-3">
          TIME PERIOD BREAKDOWN
        </p>
        <div className="space-y-2">
          {(Object.entries(insights.periods) as [string, number][]).map(
            ([period, count]) => {
              const percent = (count / insights.totalCommits) * 100;
              const isDominant = period === insights.dominantPeriod;
              return (
                <div key={period} className="flex items-center gap-3">
                  <span
                    className={`text-xs font-mono w-32 ${
                      isDominant
                        ? "text-zinc-900 dark:text-zinc-100 font-bold"
                        : "text-zinc-500 dark:text-zinc-500"
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </span>
                  <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full transition-all ${
                        isDominant
                          ? "bg-zinc-900 dark:bg-zinc-100"
                          : "bg-zinc-400 dark:bg-zinc-600"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-500 w-16 text-right">
                    {percent.toFixed(0)}%
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Developer Type */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
        <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
          {periodLabels[insights.dominantPeriod]}
        </p>
        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-500 mt-1">
          {insights.workHoursPercent}% of commits during work hours (9AM-5PM
          UTC)
        </p>
      </div>
    </div>
  );
}
