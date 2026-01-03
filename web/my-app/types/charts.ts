// Types for chart data
export interface LanguageData {
  name: string;
  value: number;
}

export interface CommitData {
  contributor: string;
  commits: number;
}

export interface TimeSeriesData {
  hour: string;
  commits: number;
}

export interface HeatmapData {
  date: string;
  count: number;
  day: number;
  hour: number;
}

export interface HistogramData {
  hour: number;
  commits: number;
}

export interface RadarMetric {
  metric: string;
  value: number;
  fullMark: number;
}

// API Response types (for when you connect to backend)
export interface RepositoryAnalysis {
  languages: LanguageData[];
  contributors: CommitData[];
  projectPulse: TimeSeriesData[];
  heatmapData: HeatmapData[];
  hourlyActivity: HistogramData[];
  healthMetrics: RadarMetric[];
}

export interface AnalyzeRequest {
  repoUrl: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: RepositoryAnalysis;
  error?: string;
}
