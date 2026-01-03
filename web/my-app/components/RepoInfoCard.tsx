"use client";

import { RepoInfo } from "@/types/charts";

interface Props {
  repoInfo: RepoInfo;
}

export default function RepoInfoCard({ repoInfo }: Props) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {repoInfo.full_name}
          </h2>
          {repoInfo.description && (
            <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-3xl">
              {repoInfo.description}
            </p>
          )}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            {repoInfo.language && (
              <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                {repoInfo.language}
              </span>
            )}
            <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
              ⭐ {formatNumber(repoInfo.stargazers_count)} stars
            </span>
            <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
              🍴 {formatNumber(repoInfo.forks_count)} forks
            </span>
            <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
              🐛 {formatNumber(repoInfo.open_issues_count)} issues
            </span>
            <span className="text-zinc-500 dark:text-zinc-500">
              Created: {formatDate(repoInfo.created_at)}
            </span>
          </div>
        </div>
        <a
          href={repoInfo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-zinc-800 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors text-sm"
        >
          View on GitHub →
        </a>
      </div>
    </div>
  );
}
