"use client";

import { useState, useEffect, useMemo } from "react";

export interface DateRange {
  start: Date;
  end: Date;
}

interface Props {
  commitTimeline: string[];
  onChange: (range: DateRange) => void;
}

// Preset options for quick selection
type PresetKey =
  | "all"
  | "last7days"
  | "last30days"
  | "last90days"
  | "lastYear"
  | "custom";

interface Preset {
  label: string;
  getDates: (min: Date, max: Date) => DateRange;
}

export default function DateRangeFilter({ commitTimeline, onChange }: Props) {
  // Calculate min/max dates from commit timeline
  const { minDate, maxDate, totalCommits, projectAge } = useMemo(() => {
    if (!commitTimeline || commitTimeline.length === 0) {
      const now = new Date();
      return {
        minDate: now,
        maxDate: now,
        totalCommits: 0,
        projectAge: "0 days",
      };
    }

    const dates = commitTimeline.map((d) => new Date(d));
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Calculate project age
    const daysDiff = Math.ceil(
      (max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)
    );
    let age: string;
    if (daysDiff < 1) {
      const hoursDiff = Math.ceil(
        (max.getTime() - min.getTime()) / (1000 * 60 * 60)
      );
      age = `${hoursDiff} hours`;
    } else if (daysDiff < 30) {
      age = `${daysDiff} days`;
    } else if (daysDiff < 365) {
      const months = Math.floor(daysDiff / 30);
      age = `${months} month${months > 1 ? "s" : ""}`;
    } else {
      const years = Math.floor(daysDiff / 365);
      const remainingMonths = Math.floor((daysDiff % 365) / 30);
      age = `${years} year${years > 1 ? "s" : ""}${
        remainingMonths > 0
          ? `, ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`
          : ""
      }`;
    }

    return {
      minDate: min,
      maxDate: max,
      totalCommits: commitTimeline.length,
      projectAge: age,
    };
  }, [commitTimeline]);

  const presets: Record<PresetKey, Preset> = {
    all: {
      label: "All Time",
      getDates: (min, max) => ({ start: min, end: max }),
    },
    last7days: {
      label: "Last 7 Days",
      getDates: (min, max) => {
        const start = new Date(max);
        start.setDate(start.getDate() - 7);
        return { start: start > min ? start : min, end: max };
      },
    },
    last30days: {
      label: "Last 30 Days",
      getDates: (min, max) => {
        const start = new Date(max);
        start.setDate(start.getDate() - 30);
        return { start: start > min ? start : min, end: max };
      },
    },
    last90days: {
      label: "Last 90 Days",
      getDates: (min, max) => {
        const start = new Date(max);
        start.setDate(start.getDate() - 90);
        return { start: start > min ? start : min, end: max };
      },
    },
    lastYear: {
      label: "Last Year",
      getDates: (min, max) => {
        const start = new Date(max);
        start.setFullYear(start.getFullYear() - 1);
        return { start: start > min ? start : min, end: max };
      },
    },
    custom: {
      label: "Custom Range",
      getDates: (min, max) => ({ start: min, end: max }),
    },
  };

  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("all");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize custom dates when minDate/maxDate change
  useEffect(() => {
    setCustomStart(minDate.toISOString().split("T")[0]);
    setCustomEnd(maxDate.toISOString().split("T")[0]);
  }, [minDate, maxDate]);

  // Apply filter when preset or custom dates change
  useEffect(() => {
    if (selectedPreset === "custom") {
      if (customStart && customEnd) {
        onChange({
          start: new Date(customStart),
          end: new Date(customEnd + "T23:59:59"),
        });
      }
    } else {
      const range = presets[selectedPreset].getDates(minDate, maxDate);
      onChange(range);
    }
  }, [selectedPreset, customStart, customEnd, minDate, maxDate]);

  // Calculate commits in selected range
  const commitsInRange = useMemo(() => {
    if (!commitTimeline || commitTimeline.length === 0) return 0;

    let start: Date, end: Date;
    if (selectedPreset === "custom") {
      start = new Date(customStart);
      end = new Date(customEnd + "T23:59:59");
    } else {
      const range = presets[selectedPreset].getDates(minDate, maxDate);
      start = range.start;
      end = range.end;
    }

    return commitTimeline.filter((d) => {
      const date = new Date(d);
      return date >= start && date <= end;
    }).length;
  }, [
    commitTimeline,
    selectedPreset,
    customStart,
    customEnd,
    minDate,
    maxDate,
  ]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
      {/* Header - Always visible */}
      <div
        className="p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Date Range Filter
                </h3>
                <p className="text-sm text-zinc-500">
                  {presets[selectedPreset].label} •{" "}
                  {commitsInRange.toLocaleString()} commits selected
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Quick stats */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-zinc-500 dark:text-zinc-400">First Commit</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {formatDate(minDate)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-zinc-500 dark:text-zinc-400">Last Commit</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {formatDate(maxDate)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-zinc-500 dark:text-zinc-400">Project Age</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {projectAge}
                </p>
              </div>
            </div>
            {/* Expand/collapse icon */}
            <svg
              className={`w-5 h-5 text-zinc-500 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-zinc-200 dark:border-zinc-800">
          {/* Mobile stats */}
          <div className="md:hidden flex justify-around py-3 text-sm border-b border-zinc-200 dark:border-zinc-700 mb-4">
            <div className="text-center">
              <p className="text-zinc-500">First</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatDate(minDate)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-zinc-500">Last</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatDate(maxDate)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-zinc-500">Age</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {projectAge}
              </p>
            </div>
          </div>

          {/* Preset buttons */}
          <div className="pt-4">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Quick Select
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(presets) as PresetKey[])
                .filter((k) => k !== "custom")
                .map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPreset(key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedPreset === key
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {presets[key].label}
                  </button>
                ))}
            </div>
          </div>

          {/* Custom date inputs */}
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Custom Range
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-500">From:</label>
                <input
                  type="date"
                  value={customStart}
                  min={minDate.toISOString().split("T")[0]}
                  max={customEnd || maxDate.toISOString().split("T")[0]}
                  onChange={(e) => {
                    setCustomStart(e.target.value);
                    setSelectedPreset("custom");
                  }}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-500">To:</label>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart || minDate.toISOString().split("T")[0]}
                  max={maxDate.toISOString().split("T")[0]}
                  onChange={(e) => {
                    setCustomEnd(e.target.value);
                    setSelectedPreset("custom");
                  }}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {selectedPreset === "custom" && (
                <button
                  onClick={() => setSelectedPreset("all")}
                  className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Reset to All
                </button>
              )}
            </div>
          </div>

          {/* Range summary */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 dark:text-blue-300">
                Showing <strong>{commitsInRange.toLocaleString()}</strong> of{" "}
                {totalCommits.toLocaleString()} commits
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                {Math.round((commitsInRange / totalCommits) * 100)}% of total
              </span>
            </div>
            {/* Visual progress bar */}
            <div className="mt-2 h-2 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
                style={{ width: `${(commitsInRange / totalCommits) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
