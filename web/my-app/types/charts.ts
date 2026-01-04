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
  if (!commitTimeline || commitTimeline.length === 0) {
    return [];
  }

  // Group commits by appropriate time unit based on data range
  const dates = commitTimeline.map((d) => new Date(d));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  const daysDiff = Math.ceil(
    (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Choose grouping based on data range
  let groupBy: "hour" | "day" | "week" | "month";
  if (daysDiff <= 1) {
    groupBy = "hour";
  } else if (daysDiff <= 60) {
    groupBy = "day";
  } else if (daysDiff <= 365) {
    groupBy = "week";
  } else {
    groupBy = "month";
  }

  const counts: Record<string, number> = {};

  commitTimeline.forEach((dateStr) => {
    const date = new Date(dateStr);
    let key: string;

    switch (groupBy) {
      case "hour":
        key = `${date.toISOString().split("T")[0]} ${date
          .getUTCHours()
          .toString()
          .padStart(2, "0")}:00`;
        break;
      case "day":
        key = date.toISOString().split("T")[0];
        break;
      case "week":
        // Get the Monday of the week
        const monday = new Date(date);
        monday.setUTCDate(date.getUTCDate() - date.getUTCDay() + 1);
        key = monday.toISOString().split("T")[0];
        break;
      case "month":
        key = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1)
          .toString()
          .padStart(2, "0")}-01`;
        break;
    }

    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([date, commits]) => ({ date, commits }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function transformHourlyActivity(
  commitTimeline: string[]
): HourlyData[] {
  if (!commitTimeline || commitTimeline.length === 0) {
    return Array(24)
      .fill(null)
      .map((_, hour) => ({ hour, commits: 0 }));
  }

  const hourlyCounts: number[] = Array(24).fill(0);

  commitTimeline.forEach((dateStr) => {
    const date = new Date(dateStr);
    const hour = date.getUTCHours();
    hourlyCounts[hour]++;
  });

  return hourlyCounts.map((commits, hour) => ({ hour, commits }));
}

// HeatmapData interface for the new dynamic heatmap
export interface HeatmapCell {
  dayLabel: string;
  hour: number;
  commits: number;
}

export interface HeatmapResult {
  grid: number[][];
  dayLabels: string[];
  timeRange: "hours" | "days" | "weeks";
}

export function transformHeatmap(commitTimeline: string[]): HeatmapResult {
  // Default empty result
  if (!commitTimeline || commitTimeline.length === 0) {
    return {
      grid: [Array(24).fill(0)],
      dayLabels: ["No data"],
      timeRange: "days",
    };
  }

  const dates = commitTimeline.map((d) => new Date(d));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  const hoursDiff = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60);
  const daysDiff = hoursDiff / 24;

  // Determine the best time range for display
  let timeRange: "hours" | "days" | "weeks";
  let numRows: number;
  let getRowIndex: (date: Date) => number;
  let getLabel: (index: number) => string;

  if (daysDiff <= 1) {
    // Less than a day - show hours grouped into 4-hour blocks
    timeRange = "hours";
    numRows = 6; // 6 x 4-hour blocks
    getRowIndex = (date: Date) => {
      const hour = date.getUTCHours();
      return Math.floor(hour / 4);
    };
    getLabel = (index: number) => `${index * 4}:00 - ${(index + 1) * 4}:00`;
  } else if (daysDiff <= 14) {
    // Up to 2 weeks - show individual days
    timeRange = "days";
    numRows = Math.min(Math.ceil(daysDiff) + 1, 14);
    const startOfDay = new Date(minDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    getRowIndex = (date: Date) => {
      const commitDay = new Date(date);
      commitDay.setUTCHours(0, 0, 0, 0);
      const dayIndex = Math.floor(
        (commitDay.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.min(Math.max(dayIndex, 0), numRows - 1);
    };
    getLabel = (index: number) => {
      const labelDate = new Date(startOfDay);
      labelDate.setUTCDate(labelDate.getUTCDate() + index);
      return labelDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    };
  } else {
    // More than 2 weeks - show weeks
    timeRange = "weeks";
    numRows = Math.min(Math.ceil(daysDiff / 7) + 1, 12); // Max 12 weeks
    const startOfWeek = new Date(minDate);
    startOfWeek.setUTCDate(minDate.getUTCDate() - minDate.getUTCDay());
    startOfWeek.setUTCHours(0, 0, 0, 0);
    getRowIndex = (date: Date) => {
      const weekIndex = Math.floor(
        (date.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24 * 7)
      );
      return Math.min(Math.max(weekIndex, 0), numRows - 1);
    };
    getLabel = (index: number) => {
      const labelDate = new Date(startOfWeek);
      labelDate.setUTCDate(labelDate.getUTCDate() + index * 7);
      return `Week of ${labelDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`;
    };
  }

  // Initialize grid
  const grid: number[][] = Array(numRows)
    .fill(null)
    .map(() => Array(24).fill(0));

  // Generate labels
  const dayLabels: string[] = Array(numRows)
    .fill(null)
    .map((_, i) => getLabel(i));

  // Count commits per row/hour
  commitTimeline.forEach((dateStr) => {
    const date = new Date(dateStr);
    const rowIndex = getRowIndex(date);
    const hour = date.getUTCHours();

    if (rowIndex >= 0 && rowIndex < numRows) {
      grid[rowIndex][hour]++;
    }
  });

  return { grid, dayLabels, timeRange };
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
