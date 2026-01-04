"use client";

import { ProjectStats, formatDate, formatDuration, formatNumber } from "@/types/analytics";

interface Props {
  stats: ProjectStats;
}

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
}

function StatCard({ label, value, subtext }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
      <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      {subtext && (
        <p className="text-xs font-mono text-zinc-400 dark:text-zinc-600 mt-1">
          {subtext}
        </p>
      )}
    </div>
  );
}

export default function StatsGrid({ stats }: Props) {
  const formatHour = (h: number): string => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px bg-zinc-200 dark:bg-zinc-800">
      <StatCard
        label="Commits"
        value={stats.filteredCommits}
        subtext={stats.filteredCommits !== stats.totalCommits ? `of ${formatNumber(stats.totalCommits)} total` : undefined}
      />
      <StatCard
        label="Contributors"
        value={stats.totalContributors}
      />
      <StatCard
        label="Languages"
        value={stats.totalLanguages}
      />
      <StatCard
        label="Project Age"
        value={formatDuration(stats.projectAgeDays)}
        subtext={stats.firstCommitDate ? `since ${formatDate(stats.firstCommitDate, 'short')}` : undefined}
      />
      <StatCard
        label="Avg/Day"
        value={formatNumber(stats.avgCommitsPerDay, 1)}
        subtext="commits per day"
      />
      <StatCard
        label="Peak Hour"
        value={stats.peakHour ? formatHour(stats.peakHour.hour) : 'N/A'}
        subtext={stats.peakHour ? `${formatNumber(stats.peakHour.count)} commits` : undefined}
      />
    </div>
  );
}
