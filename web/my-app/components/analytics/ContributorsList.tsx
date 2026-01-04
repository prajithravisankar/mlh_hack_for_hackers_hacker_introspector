"use client";

import { useState, useMemo } from "react";
import { ContributorStat, formatNumber } from "@/types/analytics";

interface Props {
  contributors: ContributorStat[];
  totalCommits: number;
}

type SortBy = 'commits' | 'name';

export default function ContributorsList({ contributors, totalCommits }: Props) {
  const [sortBy, setSortBy] = useState<SortBy>('commits');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Filter and sort
  const processed = useMemo(() => {
    let result = [...contributors];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => c.login.toLowerCase().includes(query));
    }

    // Sort
    if (sortBy === 'name') {
      result.sort((a, b) => a.login.localeCompare(b.login));
    } else {
      result.sort((a, b) => b.commits - a.commits);
    }

    return result;
  }, [contributors, searchQuery, sortBy]);

  // Visible contributors
  const visible = showAll ? processed : processed.slice(0, 10);
  const hasMore = processed.length > 10;

  if (contributors.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-4">
          Contributors
        </h3>
        <div className="h-40 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-mono text-sm">
          No contributor data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Contributors ({contributors.length})
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="px-2 py-1 text-xs font-mono border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 w-32"
          />
          
          {/* Sort toggle */}
          <button
            onClick={() => setSortBy(sortBy === 'commits' ? 'name' : 'commits')}
            className="px-2 py-1 text-xs font-mono border border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          >
            Sort: {sortBy === 'commits' ? '# Commits' : 'Name'}
          </button>
        </div>
      </div>

      {/* Contributors list */}
      <div className="space-y-1">
        {visible.map((contributor) => {
          const barWidth = (contributor.commits / Math.max(contributors[0]?.commits || 1, 1)) * 100;
          
          return (
            <div
              key={contributor.login}
              className="flex items-center gap-3 py-2 group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-2 px-2"
            >
              {/* Avatar */}
              <img
                src={contributor.avatar_url}
                alt={contributor.login}
                className="w-6 h-6 grayscale group-hover:grayscale-0 transition-all"
              />
              
              {/* Name and bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300 truncate">
                    {contributor.login}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600 ml-2">
                    {formatNumber(contributor.commits)} ({contributor.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-1 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-zinc-400 dark:bg-zinc-600 group-hover:bg-zinc-600 dark:group-hover:bg-zinc-400 transition-colors"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more/less */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full py-2 text-xs font-mono text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
        >
          {showAll ? `Show less` : `Show all ${processed.length} contributors`}
        </button>
      )}

      {/* No results */}
      {searchQuery && processed.length === 0 && (
        <div className="text-center py-4 text-xs font-mono text-zinc-400 dark:text-zinc-600">
          No contributors match "{searchQuery}"
        </div>
      )}
    </div>
  );
}
