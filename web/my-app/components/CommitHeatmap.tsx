"use client";

// Static dummy data for 3 days (72 hours) - hours of day (0-23) vs days
// Represents commit patterns during a typical 72-hour hackathon
const staticHeatmapGrid = [
  // Day 1: Starting slow, building momentum
  [2, 0, 1, 0, 0, 3, 5, 8, 6, 7, 8, 10, 7, 6, 5, 4, 2, 1, 3, 2, 5, 6, 4, 2],
  // Day 2: Peak activity during working hours
  [1, 0, 0, 2, 1, 0, 3, 5, 8, 9, 10, 8, 9, 7, 6, 4, 3, 2, 4, 6, 7, 8, 5, 3],
  // Day 3: Final push, intense activity
  [0, 1, 0, 2, 3, 4, 2, 6, 8, 9, 10, 9, 8, 7, 5, 6, 7, 5, 3, 4, 6, 8, 9, 7],
];

export default function CommitHeatmap() {
  const days = ["Day 1", "Day 2", "Day 3"];

  const getColor = (count: number) => {
    if (count === 0) return "bg-zinc-100 dark:bg-zinc-800";
    if (count <= 2) return "bg-blue-200 dark:bg-blue-900";
    if (count <= 5) return "bg-blue-400 dark:bg-blue-700";
    if (count <= 8) return "bg-blue-600 dark:bg-blue-500";
    return "bg-blue-800 dark:bg-blue-300";
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Commit Heatmap - Days vs Hours
      </h3>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-1">
            <div className="flex flex-col justify-around pr-2 text-xs text-zinc-600 dark:text-zinc-400">
              {days.map((day, i) => (
                <div key={i} className="h-6 flex items-center">
                  {day}
                </div>
              ))}
            </div>
            <div className="flex-1">
              <div className="flex gap-1 mb-2 text-xs text-zinc-600 dark:text-zinc-400">
                {[0, 4, 8, 12, 16, 20].map((h) => (
                  <div key={h} className="w-6 text-center">
                    {h}h
                  </div>
                ))}
              </div>
              {staticHeatmapGrid.map((row, dayIdx) => (
                <div key={dayIdx} className="flex gap-1 mb-1">
                  {row.map((count, hourIdx) => (
                    <div
                      key={hourIdx}
                      className={`w-6 h-6 rounded ${getColor(
                        count
                      )} transition-colors cursor-pointer hover:ring-2 hover:ring-blue-500`}
                      title={`Day ${
                        dayIdx + 1
                      }, Hour ${hourIdx}: ${count} commits`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-zinc-600 dark:text-zinc-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="w-4 h-4 bg-blue-200 dark:bg-blue-900 rounded" />
              <div className="w-4 h-4 bg-blue-400 dark:bg-blue-700 rounded" />
              <div className="w-4 h-4 bg-blue-600 dark:bg-blue-500 rounded" />
              <div className="w-4 h-4 bg-blue-800 dark:bg-blue-300 rounded" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
