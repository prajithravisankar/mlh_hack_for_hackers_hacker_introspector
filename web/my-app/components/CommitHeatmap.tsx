"use client";

// Generate dummy data for 3 days (72 hours) - hours of day (0-23) vs days
const generateHeatmapData = () => {
  const data = [];
  const startDate = new Date(2026, 0, 1); // January 1, 2026

  // Generate data for 3 days
  for (let day = 0; day < 3; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);
      date.setHours(hour);

      // Random commit count (0-10)
      const count = Math.floor(Math.random() * 11);

      data.push({
        date: date.toISOString(),
        count: count,
        day: day,
        hour: hour,
      });
    }
  }
  return data;
};

const heatmapData = generateHeatmapData();

export default function CommitHeatmap() {
  const days = ["Day 1", "Day 2", "Day 3"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Organize data by day and hour
  const grid: number[][] = Array(3)
    .fill(0)
    .map(() => Array(24).fill(0));

  heatmapData.forEach((item) => {
    grid[item.day][item.hour] = item.count;
  });

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
              {grid.map((row, dayIdx) => (
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
