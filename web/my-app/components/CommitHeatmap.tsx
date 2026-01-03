"use client";

interface Props {
  data: number[][]; // Grid of [days][hours] with commit counts
  dayLabels?: string[];
}

export default function CommitHeatmap({ data, dayLabels }: Props) {
  const defaultLabels = data.map((_, i) => `Day ${i + 1}`);
  const labels = dayLabels || defaultLabels;

  const getColor = (count: number) => {
    if (count === 0) return "bg-zinc-100 dark:bg-zinc-800";
    if (count <= 2) return "bg-blue-200 dark:bg-blue-900";
    if (count <= 5) return "bg-blue-400 dark:bg-blue-700";
    if (count <= 8) return "bg-blue-600 dark:bg-blue-500";
    return "bg-blue-800 dark:bg-blue-300";
  };

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm flex items-center justify-center h-[200px]">
        <p className="text-zinc-500">No heatmap data available</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Commit Heatmap - Activity by Hour
      </h3>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-1">
            <div className="flex flex-col justify-around pr-2 text-xs text-zinc-600 dark:text-zinc-400">
              {labels.map((label, i) => (
                <div key={i} className="h-6 flex items-center">
                  {label}
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
              {data.map((row, dayIdx) => (
                <div key={dayIdx} className="flex gap-1 mb-1">
                  {row.map((count, hourIdx) => (
                    <div
                      key={hourIdx}
                      className={`w-6 h-6 rounded ${getColor(
                        count
                      )} transition-colors cursor-pointer hover:ring-2 hover:ring-blue-500`}
                      title={`${labels[dayIdx]}, Hour ${hourIdx}:00 - ${count} commits`}
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
