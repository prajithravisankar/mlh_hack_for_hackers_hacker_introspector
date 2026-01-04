"use client";

import { useMemo } from "react";
import { LanguageStat, formatBytes, formatNumber } from "@/types/analytics";

interface Props {
  languages: LanguageStat[];
}

export default function LanguageBreakdown({ languages }: Props) {
  // Total bytes
  const totalBytes = useMemo(() => {
    return languages.reduce((sum, l) => sum + l.bytes, 0);
  }, [languages]);

  if (languages.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-4">
          Languages
        </h3>
        <div className="h-40 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-mono text-sm">
          No language data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Languages ({languages.length})
        </h3>
        <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
          {formatBytes(totalBytes)} total
        </span>
      </div>

      {/* Combined progress bar */}
      <div className="h-3 flex overflow-hidden mb-4 bg-zinc-100 dark:bg-zinc-800">
        {languages.map((lang) => (
          <div
            key={lang.name}
            className="h-full transition-all hover:opacity-80"
            style={{
              width: `${lang.percentage}%`,
              backgroundColor: lang.color,
            }}
            title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Language list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {languages.map((lang) => (
          <div key={lang.name} className="flex items-center gap-2 group">
            <div
              className="w-3 h-3 shrink-0"
              style={{ backgroundColor: lang.color }}
            />
            <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300 truncate flex-1">
              {lang.name}
            </span>
            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
              {lang.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
