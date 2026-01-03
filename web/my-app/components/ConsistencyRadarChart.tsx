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

const data = [
  {
    metric: "Consistency",
    value: 85,
    fullMark: 100,
  },
  {
    metric: "Insomnia",
    value: 70,
    fullMark: 100,
  },
  {
    metric: "Bus Factor",
    value: 60,
    fullMark: 100,
  },
  {
    metric: "Volume",
    value: 90,
    fullMark: 100,
  },
];

export default function ConsistencyRadarChart() {
  return (
    <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Project Health Metrics
      </h3>
      <ResponsiveContainer width="100%" height="100%">
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
      <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
        <p>
          <strong>Consistency:</strong> Regular commit patterns
        </p>
        <p>
          <strong>Insomnia:</strong> Late night/early morning activity
        </p>
        <p>
          <strong>Bus Factor:</strong> Knowledge distribution across team
        </p>
        <p>
          <strong>Volume:</strong> Total contribution output
        </p>
      </div>
    </div>
  );
}
