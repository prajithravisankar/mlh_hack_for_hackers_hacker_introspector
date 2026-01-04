"use client";

import { useMemo } from "react";
import { CommitDayOfWeek, formatNumber } from "@/types/analytics";

interface Props {
  data: CommitDayOfWeek[];
}

export default function WeekdayChart({ data }: Props) {
  const maxCount = useMemo(() => {
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  const totalCommits = useMemo(() => {
    return data.reduce((sum, d) => sum + d.count, 0);
  }, [data]);

  // Reorder to start with Monday
  const reorderedData = useMemo(() => {
    return [...data.slice(1), data[0]]; // Move Sunday to end
  }, [data]);

  // Find the busiest day
  const busiestDay = useMemo(() => {
    return reorderedData.reduce(
      (max, d) => (d.count > max.count ? d : max),
      reorderedData[0]
    );
  }, [reorderedData]);

  if (totalCommits === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-4">
          Activity by Day of Week
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
          Activity by Day of Week
        </h3>
        <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
          Busiest: {busiestDay.name}
        </span>
      </div>

      {/* Horizontal bar chart */}
      <div className="space-y-2">
        {reorderedData.map((item) => {
          const width = (item.count / maxCount) * 100;
          const isBusiest = item.day === busiestDay.day;

          return (
            <div key={item.day} className="flex items-center gap-3 group">
              <span className="w-10 text-xs font-mono text-zinc-500 dark:text-zinc-500 text-right">
                {item.shortName}
              </span>
              <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 relative">
                <div
                  className={`h-full transition-all ${
                    isBusiest
                      ? "bg-zinc-900 dark:bg-zinc-100"
                      : "bg-zinc-400 dark:bg-zinc-600 group-hover:bg-zinc-600 dark:group-hover:bg-zinc-400"
                  }`}
                  style={{
                    width: `${Math.max(width, item.count > 0 ? 1 : 0)}%`,
                  }}
                />
              </div>
              <span className="w-16 text-xs font-mono text-zinc-500 dark:text-zinc-500 text-right">
                {formatNumber(item.count)}
              </span>
              <span className="w-12 text-xs font-mono text-zinc-400 dark:text-zinc-600 text-right">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
