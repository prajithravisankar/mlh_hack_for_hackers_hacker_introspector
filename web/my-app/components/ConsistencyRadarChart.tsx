"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { RadarMetric } from "@/types/charts";

interface Props {
  data: RadarMetric[];
}

export default function ConsistencyRadarChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm flex items-center justify-center">
        <p className="text-zinc-500">No metrics data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Project Health Metrics
      </h3>
      <ResponsiveContainer width="100%" height="60%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Tooltip />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
      <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
        <p>
          <strong>Consistency:</strong> Regular commit patterns (higher = more
          even distribution)
        </p>
        <p>
          <strong>Insomnia:</strong> Late night/early morning activity (10pm-6am
          UTC)
        </p>
        <p>
          <strong>Bus Factor:</strong> Knowledge distribution (higher = less
          dependency on one person)
        </p>
        <p>
          <strong>Volume:</strong> Average commits per day
        </p>
      </div>
    </div>
  );
}
