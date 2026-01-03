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

  return (
    <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Commit Activity by Hour (UTC)
      </h3>
      <div className="h-[300px] flex items-end justify-between gap-1 px-2">
        {data.map((item) => {
          const height = (item.commits / maxCommits) * 100;
          return (
            <div
              key={item.hour}
              className="flex-1 flex flex-col items-center group cursor-pointer"
            >
              <div
                className="w-full bg-blue-500 dark:bg-blue-400 rounded-t transition-all hover:bg-blue-600 dark:hover:bg-blue-300"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${item.hour}:00 UTC - ${item.commits} commits`}
              />
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.commits}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400 mt-2 px-2">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
    </div>
  );
}
