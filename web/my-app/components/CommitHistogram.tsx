"use client";

// Histogram showing commit activity by hour of the day
const data = [
  { hour: 0, commits: 2 },
  { hour: 1, commits: 1 },
  { hour: 2, commits: 0 },
  { hour: 3, commits: 1 },
  { hour: 4, commits: 0 },
  { hour: 5, commits: 3 },
  { hour: 6, commits: 5 },
  { hour: 7, commits: 8 },
  { hour: 8, commits: 12 },
  { hour: 9, commits: 15 },
  { hour: 10, commits: 18 },
  { hour: 11, commits: 20 },
  { hour: 12, commits: 22 },
  { hour: 13, commits: 25 },
  { hour: 14, commits: 28 },
  { hour: 15, commits: 24 },
  { hour: 16, commits: 20 },
  { hour: 17, commits: 18 },
  { hour: 18, commits: 15 },
  { hour: 19, commits: 12 },
  { hour: 20, commits: 10 },
  { hour: 21, commits: 8 },
  { hour: 22, commits: 5 },
  { hour: 23, commits: 3 },
];

export default function CommitHistogram() {
  const maxCommits = Math.max(...data.map((d) => d.commits));

  return (
    <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Commit Activity by Hour
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
                style={{ height: `${height}%` }}
                title={`${item.hour}:00 - ${item.commits} commits`}
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
