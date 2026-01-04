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
  Area,
  AreaChart,
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

  // Calculate statistics
  const totalCommits = data.reduce((sum, d) => sum + d.commits, 0);
  const maxCommits = Math.max(...data.map((d) => d.commits));
  const avgCommits = (totalCommits / data.length).toFixed(1);

  // Determine time range for smart label formatting
  const firstDate = new Date(data[0].date);
  const lastDate = new Date(data[data.length - 1].date);
  const daysDiff = Math.ceil(
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Format date for display based on range
  const formattedData = data.map((item) => {
    const date = new Date(item.date);
    let displayDate: string;

    if (daysDiff <= 1) {
      // Show hours
      displayDate = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } else if (daysDiff <= 30) {
      // Show month and day
      displayDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } else if (daysDiff <= 365) {
      // Show week/month
      displayDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } else {
      // Show month and year
      displayDate = date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
    }

    return {
      ...item,
      displayDate,
      fullDate: date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };
  });

  // Determine interval for X-axis labels
  const labelInterval = data.length > 20 ? Math.floor(data.length / 10) : 0;

  return (
    <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Project Pulse - Commits Over Time
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            {totalCommits} commits • Max: {maxCommits}/period • Avg:{" "}
            {avgCommits}/period
          </p>
        </div>
        <div className="text-xs text-zinc-500">
          {firstDate.toLocaleDateString()} — {lastDate.toLocaleDateString()}
        </div>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11 }}
            interval={labelInterval}
            angle={data.length > 15 ? -45 : 0}
            textAnchor={data.length > 15 ? "end" : "middle"}
            height={data.length > 15 ? 60 : 30}
          />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            labelFormatter={(_, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.fullDate;
              }
              return "";
            }}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="commits"
            stroke="#8884d8"
            strokeWidth={2}
            fill="url(#colorCommits)"
            name="Commits"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
