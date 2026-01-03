// Types matching the Go backend models

// Repository info from the backend
export interface RepoInfo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  languages: Record<string, number>;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
}

// Contributor stats from GitHub API
export interface ContributorStats {
  author: {
    login: string;
    avatar_url: string;
  };
  total: number;
  weeks: Array<{
    w: number;
    a: number;
    d: number;
    c: number;
  }> | null;
}

// The main analytics report from the backend
export interface AnalyticsReport {
  id: number;
  repo_info: RepoInfo;
  contributors: ContributorStats[];
  file_types: Record<string, number>;
  commit_timeline: string[]; // ISO date strings
  generated_at: string;
}

// Frontend chart data types (transformed from backend data)
export interface LanguageData {
  name: string;
  value: number;
}

export interface ContributorData {
  contributor: string;
  commits: number;
  avatar_url?: string;
}

export interface TimelineData {
  date: string;
  commits: number;
}

export interface HourlyData {
  hour: number;
  commits: number;
}

export interface RadarMetric {
  metric: string;
  value: number;
  fullMark: number;
}

// Utility functions to transform backend data to chart data
export function transformLanguages(
  languages: Record<string, number>
): LanguageData[] {
  const total = Object.values(languages).reduce((sum, val) => sum + val, 0);
  return Object.entries(languages)
    .map(([name, value]) => ({
      name,
      value: Math.round((value / total) * 100),
    }))
    .sort((a, b) => b.value - a.value);
}

export function transformContributors(
  contributors: ContributorStats[]
): ContributorData[] {
  return contributors
    .map((c) => ({
      contributor: c.author.login,
      commits: c.total,
      avatar_url: c.author.avatar_url,
    }))
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 10); // Top 10 contributors
}

export function transformTimeline(commitTimeline: string[]): TimelineData[] {
  // Group commits by day
  const dailyCounts: Record<string, number> = {};

  commitTimeline.forEach((dateStr) => {
    const date = new Date(dateStr);
    const dayKey = date.toISOString().split("T")[0];
    dailyCounts[dayKey] = (dailyCounts[dayKey] || 0) + 1;
  });

  return Object.entries(dailyCounts)
    .map(([date, commits]) => ({ date, commits }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30); // Last 30 days with activity
}

export function transformHourlyActivity(
  commitTimeline: string[]
): HourlyData[] {
  const hourlyCounts: number[] = Array(24).fill(0);

  commitTimeline.forEach((dateStr) => {
    const date = new Date(dateStr);
    const hour = date.getUTCHours();
    hourlyCounts[hour]++;
  });

  return hourlyCounts.map((commits, hour) => ({ hour, commits }));
}

export function transformHeatmap(commitTimeline: string[]): number[][] {
  // Get the date range
  if (commitTimeline.length === 0) {
    return [Array(24).fill(0)];
  }

  const dates = commitTimeline.map((d) => new Date(d));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Calculate number of days
  const dayDiff =
    Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) +
    1;
  const numDays = Math.min(dayDiff, 7); // Max 7 days for heatmap

  // Initialize grid
  const grid: number[][] = Array(numDays)
    .fill(null)
    .map(() => Array(24).fill(0));

  // Count commits per day/hour
  commitTimeline.forEach((dateStr) => {
    const date = new Date(dateStr);
    const dayIndex = Math.floor(
      (maxDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    const hour = date.getUTCHours();

    if (dayIndex >= 0 && dayIndex < numDays) {
      grid[numDays - 1 - dayIndex][hour]++;
    }
  });

  return grid;
}

export function calculateHealthMetrics(
  contributors: ContributorStats[],
  commitTimeline: string[]
): RadarMetric[] {
  // Consistency: How evenly distributed are commits over time
  const hourlyActivity = transformHourlyActivity(commitTimeline);
  const maxHourly = Math.max(...hourlyActivity.map((h) => h.commits));
  const avgHourly = hourlyActivity.reduce((sum, h) => sum + h.commits, 0) / 24;
  const consistencyScore =
    maxHourly > 0 ? Math.round((avgHourly / maxHourly) * 100) : 0;

  // Insomnia: Percentage of commits between 10pm and 6am
  const nightCommits = hourlyActivity
    .filter((h) => h.hour >= 22 || h.hour <= 6)
    .reduce((sum, h) => sum + h.commits, 0);
  const totalCommits = commitTimeline.length;
  const insomniaScore =
    totalCommits > 0 ? Math.round((nightCommits / totalCommits) * 100) : 0;

  // Bus Factor: Distribution of commits among contributors
  const sortedContributors = [...contributors].sort(
    (a, b) => b.total - a.total
  );
  const topContributorCommits = sortedContributors[0]?.total || 0;
  const busFactorScore =
    totalCommits > 0
      ? Math.round((1 - topContributorCommits / totalCommits) * 100)
      : 0;

  // Volume: Normalized by number of days active
  const uniqueDays = new Set(
    commitTimeline.map((d) => new Date(d).toISOString().split("T")[0])
  ).size;
  const volumeScore = Math.min(
    100,
    Math.round((totalCommits / Math.max(uniqueDays, 1)) * 10)
  );

  return [
    {
      metric: "Consistency",
      value: Math.min(consistencyScore, 100),
      fullMark: 100,
    },
    { metric: "Insomnia", value: insomniaScore, fullMark: 100 },
    { metric: "Bus Factor", value: Math.max(busFactorScore, 0), fullMark: 100 },
    { metric: "Volume", value: volumeScore, fullMark: 100 },
  ];
}
