"use client";

import { useMemo } from "react";
import { CommitDay, formatNumber } from "@/types/analytics";

interface Props {
  data: CommitDay[];
}

export default function RecentActivity({ data }: Props) {
  // Get the most recent 30 days with activity
  const recentDays = useMemo(() => {
    // Get last 30 entries or all if less
    const recent = data.slice(-30);
    return recent;
  }, [data]);

  // Group by week for display
  const weeklyData = useMemo(() => {
    if (recentDays.length === 0) return [];

    const weeks: { weekStart: string; days: CommitDay[]; total: number }[] = [];
    let currentWeek: CommitDay[] = [];
    let currentWeekStart = "";

    recentDays.forEach((day, idx) => {
      // Start new week on Sunday (dayOfWeek === 0)
      if (day.dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push({
          weekStart: currentWeekStart,
          days: currentWeek,
          total: currentWeek.reduce((s, d) => s + d.count, 0),
        });
        currentWeek = [];
      }

      if (currentWeek.length === 0) {
        currentWeekStart = day.date;
      }
      currentWeek.push(day);

      // Push last week
      if (idx === recentDays.length - 1 && currentWeek.length > 0) {
        weeks.push({
          weekStart: currentWeekStart,
          days: currentWeek,
          total: currentWeek.reduce((s, d) => s + d.count, 0),
        });
      }
    });

    return weeks;
  }, [recentDays]);

  // Calculate max for scaling
  const maxDayCount = useMemo(() => {
    if (recentDays.length === 0) return 1;
    return Math.max(...recentDays.map((d) => d.count), 1);
  }, [recentDays]);

  const totalCommits = useMemo(() => {
    return recentDays.reduce((s, d) => s + d.count, 0);
  }, [recentDays]);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getIntensity = (count: number): string => {
    if (count === 0) return "bg-zinc-100 dark:bg-zinc-800";
    const ratio = count / maxDayCount;
    if (ratio <= 0.25) return "bg-zinc-300 dark:bg-zinc-700";
    if (ratio <= 0.5) return "bg-zinc-400 dark:bg-zinc-600";
    if (ratio <= 0.75) return "bg-zinc-600 dark:bg-zinc-400";
    return "bg-zinc-900 dark:bg-zinc-100";
  };

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-4">
          Recent Activity
        </h3>
        <div className="h-48 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-mono text-sm">
          No commit data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-baseline justify-between mb-6">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Recent Activity (Last 30 Days)
        </h3>
        <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
          {formatNumber(totalCommits)} commits
        </span>
      </div>

      {/* Simple grid view */}
      <div className="space-y-3">
        {/* Day headers */}
        <div className="flex gap-1 ml-20">
          {dayLabels.map((label, idx) => (
            <div
              key={idx}
              className="w-8 text-center text-xs font-mono text-zinc-400 dark:text-zinc-600"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeklyData.map((week, weekIdx) => (
          <div key={weekIdx} className="flex items-center gap-2">
            <span className="w-16 text-xs font-mono text-zinc-400 dark:text-zinc-600 text-right">
              {formatDate(week.weekStart)}
            </span>
            <div className="flex gap-1">
              {/* Fill empty days at start of week */}
              {week.days[0] &&
                week.days[0].dayOfWeek > 0 &&
                Array(week.days[0].dayOfWeek)
                  .fill(null)
                  .map((_, i) => (
                    <div key={`empty-${i}`} className="w-8 h-8" />
                  ))}
              {week.days.map((day) => (
                <div
                  key={day.date}
                  className={`w-8 h-8 ${getIntensity(
                    day.count
                  )} group relative cursor-pointer transition-transform hover:scale-110`}
                  title={`${formatDate(day.date)}: ${day.count} commits`}
                >
                  {day.count > 0 && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white dark:text-zinc-900 opacity-0 group-hover:opacity-100">
                      {day.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-500 w-12 text-right">
              {week.total > 0 ? formatNumber(week.total) : "-"}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-6 text-xs font-mono text-zinc-400 dark:text-zinc-600">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-zinc-100 dark:bg-zinc-800" />
          <div className="w-4 h-4 bg-zinc-300 dark:bg-zinc-700" />
          <div className="w-4 h-4 bg-zinc-400 dark:bg-zinc-600" />
          <div className="w-4 h-4 bg-zinc-600 dark:bg-zinc-400" />
          <div className="w-4 h-4 bg-zinc-900 dark:bg-zinc-100" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
