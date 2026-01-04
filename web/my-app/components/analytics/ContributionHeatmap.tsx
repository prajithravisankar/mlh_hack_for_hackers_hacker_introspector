"use client";

import { useMemo } from "react";
import { HeatmapCell, formatNumber } from "@/types/analytics";

interface Props {
  data: HeatmapCell[];
  weeksToShow?: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ContributionHeatmap({ data, weeksToShow = 52 }: Props) {
  // Get max count for color scaling
  const maxCount = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map(d => d.count), 1);
  }, [data]);

  // Group cells by week
  const weeks = useMemo(() => {
    const grouped: HeatmapCell[][] = [];
    let currentWeek: HeatmapCell[] = [];
    let lastWeekIndex = -1;

    data.forEach(cell => {
      if (cell.weekIndex !== lastWeekIndex && currentWeek.length > 0) {
        grouped.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(cell);
      lastWeekIndex = cell.weekIndex;
    });
    
    if (currentWeek.length > 0) {
      grouped.push(currentWeek);
    }

    return grouped;
  }, [data]);

  // Get month labels
  const monthLabels = useMemo(() => {
    if (data.length === 0) return [];
    
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = '';
    
    data.forEach(cell => {
      const date = new Date(cell.date);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      if (month !== lastMonth) {
        labels.push({ month, weekIndex: cell.weekIndex });
        lastMonth = month;
      }
    });
    
    return labels;
  }, [data]);

  // Get color for count
  const getColor = (count: number): string => {
    if (count === 0) return 'bg-zinc-100 dark:bg-zinc-800';
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 'bg-zinc-300 dark:bg-zinc-700';
    if (ratio <= 0.5) return 'bg-zinc-400 dark:bg-zinc-600';
    if (ratio <= 0.75) return 'bg-zinc-600 dark:bg-zinc-400';
    return 'bg-zinc-900 dark:bg-zinc-100';
  };

  // Total commits
  const totalCommits = useMemo(() => {
    return data.reduce((sum, d) => sum + d.count, 0);
  }, [data]);

  // Active days
  const activeDays = useMemo(() => {
    return data.filter(d => d.count > 0).length;
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-4">
          Contribution Heatmap
        </h3>
        <div className="h-32 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-mono text-sm">
          No commit data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Contribution Heatmap
        </h3>
        <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
          {formatNumber(totalCommits)} commits on {formatNumber(activeDays)} days
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex ml-8 mb-1">
            {monthLabels.map(({ month, weekIndex }, idx) => (
              <span
                key={`${month}-${weekIndex}-${idx}`}
                className="text-xs font-mono text-zinc-400 dark:text-zinc-600"
                style={{
                  position: 'absolute',
                  left: `${32 + weekIndex * 13}px`,
                }}
              >
                {month}
              </span>
            ))}
          </div>

          <div className="flex gap-1 mt-5">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pr-1">
              {DAYS.map((day, idx) => (
                <div
                  key={day}
                  className="h-[10px] flex items-center text-xs font-mono text-zinc-400 dark:text-zinc-600"
                  style={{ visibility: idx % 2 === 0 ? 'hidden' : 'visible' }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {/* Fill in empty cells at the start of first week */}
                  {weekIdx === 0 && week[0]?.dayOfWeek > 0 && (
                    Array(week[0].dayOfWeek).fill(null).map((_, i) => (
                      <div key={`empty-${i}`} className="w-[10px] h-[10px]" />
                    ))
                  )}
                  {week.map((cell) => (
                    <div
                      key={cell.date}
                      className={`w-[10px] h-[10px] ${getColor(cell.count)} group relative cursor-pointer`}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {cell.count} commit{cell.count !== 1 ? 's' : ''} on{' '}
                        {new Date(cell.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-xs font-mono text-zinc-400 dark:text-zinc-600">
            <span>Less</span>
            <div className="flex gap-[2px]">
              <div className="w-[10px] h-[10px] bg-zinc-100 dark:bg-zinc-800" />
              <div className="w-[10px] h-[10px] bg-zinc-300 dark:bg-zinc-700" />
              <div className="w-[10px] h-[10px] bg-zinc-400 dark:bg-zinc-600" />
              <div className="w-[10px] h-[10px] bg-zinc-600 dark:bg-zinc-400" />
              <div className="w-[10px] h-[10px] bg-zinc-900 dark:bg-zinc-100" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
