"use client";

import { useMemo } from "react";
import { CommitDay, formatNumber } from "@/types/analytics";

interface Props {
  data: CommitDay[];
}

export default function ActivitySummary({ data }: Props) {
  // Calculate stats
  const stats = useMemo(() => {
    if (data.length === 0) {
      return {
        totalCommits: 0,
        activeDays: 0,
        totalDays: 0,
        avgPerActiveDay: 0,
        mostActiveDate: null as string | null,
        mostActiveCount: 0,
        streakDays: 0,
        weekendCommits: 0,
        weekdayCommits: 0,
      };
    }

    const totalCommits = data.reduce((sum, d) => sum + d.count, 0);
    const activeDays = data.filter((d) => d.count > 0).length;

    // Find most active day
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const mostActive = sorted[0];

    // Calculate current streak (consecutive days with commits from most recent)
    let streak = 0;
    const reversedData = [...data].reverse();
    for (const day of reversedData) {
      if (day.count > 0) {
        streak++;
      } else {
        break;
      }
    }

    // Weekend vs weekday
    let weekendCommits = 0;
    let weekdayCommits = 0;
    data.forEach((d) => {
      if (d.dayOfWeek === 0 || d.dayOfWeek === 6) {
        weekendCommits += d.count;
      } else {
        weekdayCommits += d.count;
      }
    });

    return {
      totalCommits,
      activeDays,
      totalDays: data.length,
      avgPerActiveDay: activeDays > 0 ? totalCommits / activeDays : 0,
      mostActiveDate: mostActive?.date || null,
      mostActiveCount: mostActive?.count || 0,
      streakDays: streak,
      weekendCommits,
      weekdayCommits,
    };
  }, [data]);

  // Format date nicely
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-4">
          Activity Summary
        </h3>
        <div className="h-48 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-mono text-sm">
          No commit data available
        </div>
      </div>
    );
  }

  const workLifeRatio =
    stats.weekdayCommits > 0
      ? ((stats.weekendCommits / stats.weekdayCommits) * 100).toFixed(0)
      : "0";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
      <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-6">
        Activity Summary
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Total Commits */}
        <div>
          <p className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {formatNumber(stats.totalCommits)}
          </p>
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-500 mt-1">
            total commits
          </p>
        </div>

        {/* Active Days */}
        <div>
          <p className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {formatNumber(stats.activeDays)}
          </p>
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-500 mt-1">
            active days (
            {((stats.activeDays / Math.max(stats.totalDays, 1)) * 100).toFixed(
              0
            )}
            %)
          </p>
        </div>

        {/* Avg per Active Day */}
        <div>
          <p className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {formatNumber(stats.avgPerActiveDay, 1)}
          </p>
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-500 mt-1">
            avg commits/active day
          </p>
        </div>

        {/* Most Active Day */}
        <div>
          <p className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {formatNumber(stats.mostActiveCount)}
          </p>
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-500 mt-1">
            peak ({formatDate(stats.mostActiveDate)})
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 my-6" />

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-6">
        {/* Current Streak */}
        <div className="text-center">
          <p className="text-xl font-bold font-mono text-zinc-700 dark:text-zinc-300">
            {stats.streakDays} day{stats.streakDays !== 1 ? "s" : ""}
          </p>
          <p className="text-xs font-mono text-zinc-400 dark:text-zinc-600 mt-1">
            recent streak
          </p>
        </div>

        {/* Weekday Commits */}
        <div className="text-center">
          <p className="text-xl font-bold font-mono text-zinc-700 dark:text-zinc-300">
            {formatNumber(stats.weekdayCommits)}
          </p>
          <p className="text-xs font-mono text-zinc-400 dark:text-zinc-600 mt-1">
            weekday commits
          </p>
        </div>

        {/* Weekend Commits */}
        <div className="text-center">
          <p className="text-xl font-bold font-mono text-zinc-700 dark:text-zinc-300">
            {formatNumber(stats.weekendCommits)}
          </p>
          <p className="text-xs font-mono text-zinc-400 dark:text-zinc-600 mt-1">
            weekend commits ({workLifeRatio}% ratio)
          </p>
        </div>
      </div>
    </div>
  );
}
