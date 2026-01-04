"use client";

import { DatePreset, DateRange, formatDate } from "@/types/analytics";

interface Props {
  datePreset: DatePreset;
  dateRange: DateRange | null;
  minDate: Date | null;
  maxDate: Date | null;
  totalCommits: number;
  filteredCommits: number;
  onPresetChange: (preset: DatePreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
}

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: '1y', label: '1 Year' },
];

export default function FilterBar({
  datePreset,
  dateRange,
  minDate,
  maxDate,
  totalCommits,
  filteredCommits,
  onPresetChange,
  onCustomRangeChange,
}: Props) {
  const showingFiltered = filteredCommits !== totalCommits;

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value || !dateRange) return;
    const newStart = new Date(e.target.value);
    onCustomRangeChange({ start: newStart, end: dateRange.end });
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value || !dateRange) return;
    const newEnd = new Date(e.target.value);
    onCustomRangeChange({ start: dateRange.start, end: newEnd });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Preset buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mr-2">
            Time Range:
          </span>
          {PRESETS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onPresetChange(key)}
              className={`px-3 py-1.5 text-sm font-mono border transition-colors ${
                datePreset === key
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                  : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-500'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => onPresetChange('custom')}
            className={`px-3 py-1.5 text-sm font-mono border transition-colors ${
              datePreset === 'custom'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-500'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Right: Stats summary */}
        <div className="flex items-center gap-4 text-sm font-mono">
          {showingFiltered && (
            <span className="text-zinc-500 dark:text-zinc-400">
              Showing <span className="font-bold text-zinc-900 dark:text-zinc-100">{filteredCommits.toLocaleString()}</span> of {totalCommits.toLocaleString()} commits
            </span>
          )}
          {!showingFiltered && (
            <span className="text-zinc-500 dark:text-zinc-400">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{totalCommits.toLocaleString()}</span> total commits
            </span>
          )}
        </div>
      </div>

      {/* Custom date range inputs */}
      {datePreset === 'custom' && dateRange && (
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">From:</label>
            <input
              type="date"
              value={dateRange.start.toISOString().split('T')[0]}
              min={minDate?.toISOString().split('T')[0]}
              max={dateRange.end.toISOString().split('T')[0]}
              onChange={handleStartChange}
              className="px-3 py-1.5 text-sm font-mono border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">To:</label>
            <input
              type="date"
              value={dateRange.end.toISOString().split('T')[0]}
              min={dateRange.start.toISOString().split('T')[0]}
              max={maxDate?.toISOString().split('T')[0]}
              onChange={handleEndChange}
              className="px-3 py-1.5 text-sm font-mono border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-500 font-mono">
            {formatDate(dateRange.start, 'short')} → {formatDate(dateRange.end, 'short')}
          </span>
        </div>
      )}
    </div>
  );
}
