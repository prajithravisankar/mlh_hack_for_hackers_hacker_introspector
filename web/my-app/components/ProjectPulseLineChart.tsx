"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TimelineData } from "@/types/charts";

interface Props {
  data: TimelineData[];
}

export default function ProjectPulseLineChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm flex items-center justify-center">
        <p className="text-zinc-500">No timeline data available</p>
      </div>
    );
  }

  // Format date for display
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Project Pulse - Commits Over Time
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis />
          <Tooltip
            labelFormatter={(_, payload) => {
              if (payload && payload[0]) {
                return `Date: ${payload[0].payload.date}`;
              }
              return "";
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="commits"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Commits"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
