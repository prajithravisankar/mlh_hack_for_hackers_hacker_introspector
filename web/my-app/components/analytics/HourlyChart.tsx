"use client";

import { useMemo } from "react";
import { CommitHour, formatNumber } from "@/types/analytics";

interface Props {
  data: CommitHour[];
}

export default function HourlyChart({ data }: Props) {
  const maxCount = useMemo(() => {
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  const totalCommits = useMemo(() => {
    return data.reduce((sum, d) => sum + d.count, 0);
  }, [data]);

  // Find peak hours
  const peakHours = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.count - a.count);
    return sorted.slice(0, 3).filter((h) => h.count > 0);
  }, [data]);

  if (totalCommits === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-4">
          Activity by Hour (UTC)
        </h3>
        <div className="h-40 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-mono text-sm">
          No commit data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Activity by Hour (UTC)
        </h3>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
          Peak:{" "}
          {peakHours.length > 0
            ? peakHours.map((h) => h.label).join(", ")
            : "N/A"}
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-40">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-b border-zinc-100 dark:border-zinc-800"
            />
          ))}
        </div>

        {/* Bars */}
        <div className="relative h-full flex items-end gap-1">
          {data.map((item) => {
            const height = (item.count / maxCount) * 100;
            const isPeak = peakHours.some((h) => h.hour === item.hour);

            return (
              <div
                key={item.hour}
                className="flex-1 group relative flex flex-col items-center"
              >
                <div
                  className={`w-full transition-colors ${
                    isPeak
                      ? "bg-zinc-900 dark:bg-zinc-100"
                      : "bg-zinc-400 dark:bg-zinc-600 hover:bg-zinc-600 dark:hover:bg-zinc-400"
                  }`}
                  style={{
                    height: `${Math.max(height, item.count > 0 ? 3 : 0)}%`,
                  }}
                />

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {item.label}: {formatNumber(item.count)} commits
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs font-mono text-zinc-400 dark:text-zinc-600">
        <span>12AM</span>
        <span>6AM</span>
        <span>12PM</span>
        <span>6PM</span>
        <span>12AM</span>
      </div>
    </div>
  );
}
