"use client";

import { RepoInfo, formatDate, formatNumber } from "@/types/analytics";

interface Props {
  repoInfo: RepoInfo;
}

export default function RepoHeader({ repoInfo }: Props) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Left: Repo info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 truncate">
            {repoInfo.full_name}
          </h2>
          {repoInfo.description && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {repoInfo.description}
            </p>
          )}

          {/* Meta info */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-mono text-zinc-500 dark:text-zinc-500">
            {repoInfo.language && (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-zinc-400 dark:bg-zinc-600 rounded-full" />
                {repoInfo.language}
              </span>
            )}
            <span>★ {formatNumber(repoInfo.stargazers_count)}</span>
            <span>⑂ {formatNumber(repoInfo.forks_count)}</span>
            {repoInfo.open_issues_count > 0 && (
              <span>○ {formatNumber(repoInfo.open_issues_count)} issues</span>
            )}
            {repoInfo.created_at && (
              <span>
                Created {formatDate(new Date(repoInfo.created_at), "medium")}
              </span>
            )}
          </div>
        </div>

        {/* Right: Link */}
        <a
          href={repoInfo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-sm font-mono border border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-500 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shrink-0"
        >
          View on GitHub →
        </a>
      </div>
    </div>
  );
}
