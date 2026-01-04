"use client";

import { HourlyData } from "@/types/charts";

interface Props {
  data: HourlyData[];
}

export default function CommitHistogram({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm flex items-center justify-center">
        <p className="text-zinc-500">No hourly activity data available</p>
      </div>
    );
  }

  const maxCommits = Math.max(...data.map((d) => d.commits), 1);
  const totalCommits = data.reduce((sum, d) => sum + d.commits, 0);

  // Find peak hour
  const peakHour = data.reduce(
    (max, d) => (d.commits > max.commits ? d : max),
    data[0]
  );

  return (
    <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Commit Activity by Hour (UTC)
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            Peak: {peakHour.hour}:00 UTC ({peakHour.commits} commits) • Total:{" "}
            {totalCommits} commits
          </p>
        </div>
      </div>
      <div className="h-[280px] flex items-end justify-between gap-1 px-2 relative">
        {/* Y-axis scale indicators */}
        <div className="absolute left-0 top-0 h-full w-8 flex flex-col justify-between text-xs text-zinc-400 -ml-2">
          <span>{maxCommits}</span>
          <span>{Math.round(maxCommits / 2)}</span>
          <span>0</span>
        </div>
        {/* Bars */}
        <div className="flex-1 flex items-end justify-between gap-1 ml-6">
          {data.map((item) => {
            const height =
              maxCommits > 0 ? (item.commits / maxCommits) * 100 : 0;
            const isPeak =
              item.commits === peakHour.commits && item.commits > 0;
            return (
              <div
                key={item.hour}
                className="flex-1 flex flex-col items-center group cursor-pointer"
              >
                <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  {item.commits}
                </div>
                <div
                  className={`w-full rounded-t transition-all ${
                    isPeak
                      ? "bg-blue-600 dark:bg-blue-400 hover:bg-blue-700 dark:hover:bg-blue-300"
                      : "bg-blue-400 dark:bg-blue-500 hover:bg-blue-500 dark:hover:bg-blue-400"
                  }`}
                  style={{
                    height: `${Math.max(height, item.commits > 0 ? 3 : 0)}%`,
                  }}
                  title={`${item.hour}:00 UTC - ${item.commits} commits`}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400 mt-2 px-2 ml-6">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
    </div>
  );
}
