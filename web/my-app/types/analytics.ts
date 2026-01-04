// ============================================
// ANALYTICS TYPES - Clean, type-safe definitions
// ============================================

// Raw data from backend API
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

export interface Contributor {
  author: {
    login: string;
    avatar_url: string;
  };
  total: number;
  weeks: Array<{ w: number; a: number; d: number; c: number }> | null;
}

export interface AnalyticsReport {
  id: number;
  repo_info: RepoInfo;
  contributors: Contributor[];
  file_types: Record<string, number>;
  commit_timeline: string[];
  generated_at: string;
}

// ============================================
// FILTER TYPES
// ============================================

export interface DateRange {
  start: Date;
  end: Date;
}

export type DatePreset = "all" | "7d" | "30d" | "90d" | "1y" | "custom";

export interface FilterState {
  dateRange: DateRange | null;
  datePreset: DatePreset;
  selectedContributors: string[];
  searchQuery: string;
}

// ============================================
// PROCESSED DATA TYPES
// ============================================

export interface CommitDay {
  date: string;
  count: number;
  dayOfWeek: number;
  weekNumber: number;
}

export interface CommitHour {
  hour: number;
  count: number;
  label: string;
}

export interface CommitDayOfWeek {
  day: number;
  name: string;
  shortName: string;
  count: number;
  percentage: number;
}

export interface ContributorStat {
  login: string;
  avatar_url: string;
  commits: number;
  percentage: number;
  rank: number;
}

export interface LanguageStat {
  name: string;
  bytes: number;
  percentage: number;
  color: string;
}

export interface ProjectStats {
  totalCommits: number;
  filteredCommits: number;
  totalContributors: number;
  totalLanguages: number;
  firstCommitDate: Date | null;
  lastCommitDate: Date | null;
  projectAgeDays: number;
  avgCommitsPerDay: number;
  avgCommitsPerWeek: number;
  peakDay: { date: string; count: number } | null;
  peakHour: { hour: number; count: number } | null;
}

export interface HeatmapCell {
  date: string;
  count: number;
  dayOfWeek: number;
  weekIndex: number;
}

// Language colors
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#333333",
  TypeScript: "#444444",
  Python: "#555555",
  Java: "#666666",
  Go: "#777777",
  Rust: "#888888",
  C: "#999999",
  "C++": "#aaaaaa",
  Ruby: "#bbbbbb",
  PHP: "#cccccc",
  Swift: "#3d3d3d",
  Kotlin: "#4d4d4d",
  Scala: "#5d5d5d",
  Shell: "#6d6d6d",
  HTML: "#7d7d7d",
  CSS: "#8d8d8d",
  SCSS: "#9d9d9d",
  Vue: "#adadad",
  Svelte: "#bdbdbd",
};

export function getLanguageColor(name: string): string {
  return LANGUAGE_COLORS[name] || "#666666";
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseCommitDates(timeline: string[] | undefined): Date[] {
  if (!timeline || timeline.length === 0) return [];
  return timeline
    .map((s) => new Date(s))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
}

export function getDateRangeFromPreset(preset: DatePreset, allDates: Date[]): DateRange | null {
  if (allDates.length === 0) return null;
  const minDate = allDates[0];
  const maxDate = allDates[allDates.length - 1];
  if (preset === "all") return { start: minDate, end: maxDate };
  const end = new Date(maxDate);
  const start = new Date(maxDate);
  switch (preset) {
    case "7d": start.setDate(end.getDate() - 7); break;
    case "30d": start.setDate(end.getDate() - 30); break;
    case "90d": start.setDate(end.getDate() - 90); break;
    case "1y": start.setFullYear(end.getFullYear() - 1); break;
    case "custom": return null;
  }
  return { start: start < minDate ? minDate : start, end };
}

export function filterDatesByRange(dates: Date[], range: DateRange | null): Date[] {
  if (!range) return dates;
  const startTime = range.start.getTime();
  const endTime = range.end.getTime();
  return dates.filter((d) => {
    const time = d.getTime();
    return time >= startTime && time <= endTime;
  });
}

export function groupCommitsByDay(dates: Date[]): CommitDay[] {
  if (dates.length === 0) return [];
  const counts: Record<string, number> = {};
  dates.forEach((date) => {
    const key = date.toISOString().split("T")[0];
    counts[key] = (counts[key] || 0) + 1;
  });
  const getWeekNumber = (d: Date): number => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };
  return Object.entries(counts)
    .map(([date, count]) => {
      const d = new Date(date);
      return { date, count, dayOfWeek: d.getDay(), weekNumber: getWeekNumber(d) };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function groupCommitsByHour(dates: Date[]): CommitHour[] {
  const counts: number[] = Array(24).fill(0);
  dates.forEach((date) => { counts[date.getUTCHours()]++; });
  const formatHour = (h: number): string => {
    if (h === 0) return "12 AM";
    if (h === 12) return "12 PM";
    return h < 12 ? h + " AM" : (h - 12) + " PM";
  };
  return counts.map((count, hour) => ({ hour, count, label: formatHour(hour) }));
}

export function groupCommitsByDayOfWeek(dates: Date[]): CommitDayOfWeek[] {
  const counts: number[] = Array(7).fill(0);
  dates.forEach((date) => { counts[date.getDay()]++; });
  const total = dates.length;
  return counts.map((count, day) => ({
    day,
    name: DAY_NAMES[day],
    shortName: DAY_SHORT[day],
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));
}

export function generateHeatmapData(dates: Date[], weeksToShow: number = 52): HeatmapCell[] {
  if (dates.length === 0) return [];
  const counts: Record<string, number> = {};
  dates.forEach((date) => {
    const key = date.toISOString().split("T")[0];
    counts[key] = (counts[key] || 0) + 1;
  });
  const maxDate = dates[dates.length - 1];
  const endDate = new Date(Math.max(maxDate.getTime(), Date.now()));
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - weeksToShow * 7);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const cells: HeatmapCell[] = [];
  const current = new Date(startDate);
  let weekIndex = 0;
  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    const dayOfWeek = current.getDay();
    if (dayOfWeek === 0 && cells.length > 0) weekIndex++;
    cells.push({ date: dateStr, count: counts[dateStr] || 0, dayOfWeek, weekIndex });
    current.setDate(current.getDate() + 1);
  }
  return cells;
}

export function processContributors(contributors: Contributor[] | undefined): ContributorStat[] {
  if (!contributors || contributors.length === 0) return [];
  const total = contributors.reduce((sum, c) => sum + c.total, 0);
  return contributors
    .map((c) => ({
      login: c.author.login,
      avatar_url: c.author.avatar_url,
      commits: c.total,
      percentage: total > 0 ? (c.total / total) * 100 : 0,
      rank: 0,
    }))
    .sort((a, b) => b.commits - a.commits)
    .map((c, idx) => ({ ...c, rank: idx + 1 }));
}

export function processLanguages(languages: Record<string, number> | undefined): LanguageStat[] {
  if (!languages) return [];
  const total = Object.values(languages).reduce((sum, val) => sum + val, 0);
  return Object.entries(languages)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: total > 0 ? (bytes / total) * 100 : 0,
      color: getLanguageColor(name),
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

export function calculateProjectStats(
  report: AnalyticsReport | null,
  allDates: Date[],
  filteredDates: Date[]
): ProjectStats {
  const empty: ProjectStats = {
    totalCommits: 0,
    filteredCommits: 0,
    totalContributors: 0,
    totalLanguages: 0,
    firstCommitDate: null,
    lastCommitDate: null,
    projectAgeDays: 0,
    avgCommitsPerDay: 0,
    avgCommitsPerWeek: 0,
    peakDay: null,
    peakHour: null,
  };
  if (!report || allDates.length === 0) return empty;
  const firstDate = allDates[0];
  const lastDate = allDates[allDates.length - 1];
  const projectAgeDays = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  const byDay = groupCommitsByDay(filteredDates);
  const peakDay = byDay.length > 0 ? byDay.reduce((max, d) => (d.count > max.count ? d : max), byDay[0]) : null;
  const byHour = groupCommitsByHour(filteredDates);
  const peakHour = byHour.reduce((max, h) => (h.count > max.count ? h : max), byHour[0]);
  return {
    totalCommits: allDates.length,
    filteredCommits: filteredDates.length,
    totalContributors: report.contributors?.length || 0,
    totalLanguages: Object.keys(report.repo_info?.languages || {}).length,
    firstCommitDate: firstDate,
    lastCommitDate: lastDate,
    projectAgeDays,
    avgCommitsPerDay: filteredDates.length / Math.max(1, projectAgeDays),
    avgCommitsPerWeek: (filteredDates.length / Math.max(1, projectAgeDays)) * 7,
    peakDay: peakDay ? { date: peakDay.date, count: peakDay.count } : null,
    peakHour: peakHour.count > 0 ? { hour: peakHour.hour, count: peakHour.count } : null,
  };
}

export function formatDate(date: Date | null, style: "short" | "medium" | "long" = "medium"): string {
  if (!date) return "N/A";
  const opts: Intl.DateTimeFormatOptions =
    style === "short" ? { month: "short", day: "numeric" }
    : style === "medium" ? { year: "numeric", month: "short", day: "numeric" }
    : { weekday: "short", year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString("en-US", opts);
}

export function formatNumber(num: number, decimals: number = 0): string {
  if (decimals > 0) {
    return num.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  return num.toLocaleString("en-US");
}

export function formatDuration(days: number): string {
  if (days < 1) return "Less than a day";
  if (days < 7) return Math.round(days) + " day" + (days !== 1 ? "s" : "");
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return weeks + " week" + (weeks !== 1 ? "s" : "");
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return months + " month" + (months !== 1 ? "s" : "");
  }
  const years = Math.floor(days / 365);
  const remainingMonths = Math.round((days % 365) / 30);
  if (remainingMonths > 0) {
    return years + " year" + (years !== 1 ? "s" : "") + ", " + remainingMonths + " month" + (remainingMonths !== 1 ? "s" : "");
  }
  return years + " year" + (years !== 1 ? "s" : "");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
