"use client";

import { useMemo } from "react";
import { CommitDay, formatNumber } from "@/types/analytics";

interface Props {
  data: CommitDay[];
  title?: string;
}

export default function CommitTimeline({
  data,
  title = "Commit Activity",
}: Props) {
  // Calculate the max value for scaling
  const maxCount = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  // Calculate total commits
  const totalCommits = useMemo(() => {
    return data.reduce((sum, d) => sum + d.count, 0);
  }, [data]);

  // Format date for display
  const formatDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Intelligently sample labels based on data length
  const getLabelIndices = (): number[] => {
    const len = data.length;
    if (len <= 10) return data.map((_, i) => i);

    const step = Math.ceil(len / 8);
    const indices: number[] = [0];
    for (let i = step; i < len - step / 2; i += step) {
      indices.push(i);
    }
    indices.push(len - 1);
    return indices;
  };

  const labelIndices = getLabelIndices();

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-4">
          {title}
        </h3>
        <div className="h-48 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-mono text-sm">
          No commit data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          {title}
        </h3>
        <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
          {formatNumber(totalCommits)} commits over {data.length} days
        </span>
      </div>

      {/* Chart container */}
      <div className="relative h-48">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-right pr-2">
          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
            {maxCount}
          </span>
          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
            {Math.round(maxCount / 2)}
          </span>
          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
            0
          </span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full flex flex-col">
          {/* Bars */}
          <div className="flex-1 flex items-end gap-px">
            {data.map((item, idx) => {
              const height = (item.count / maxCount) * 100;
              return (
                <div
                  key={item.date}
                  className="flex-1 min-w-[2px] group relative"
                  style={{ maxWidth: "20px" }}
                >
                  <div
                    className="w-full bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-600 dark:hover:bg-zinc-400 transition-colors"
                    style={{
                      height: `${Math.max(height, item.count > 0 ? 2 : 0)}%`,
                    }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {formatDateLabel(item.date)}: {item.count} commits
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="h-6 flex items-center relative mt-1">
            {labelIndices.map((idx) => (
              <span
                key={idx}
                className="absolute text-xs font-mono text-zinc-400 dark:text-zinc-600 whitespace-nowrap"
                style={{
                  left: `${(idx / (data.length - 1)) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {formatDateLabel(data[idx].date)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
