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

// Data grouped by hours over 72 hours (3 days)
const data = [
  { hour: "0h", commits: 2 },
  { hour: "4h", commits: 0 },
  { hour: "8h", commits: 5 },
  { hour: "12h", commits: 8 },
  { hour: "16h", commits: 12 },
  { hour: "20h", commits: 15 },
  { hour: "24h", commits: 10 },
  { hour: "28h", commits: 8 },
  { hour: "32h", commits: 6 },
  { hour: "36h", commits: 9 },
  { hour: "40h", commits: 14 },
  { hour: "44h", commits: 18 },
  { hour: "48h", commits: 20 },
  { hour: "52h", commits: 16 },
  { hour: "56h", commits: 12 },
  { hour: "60h", commits: 15 },
  { hour: "64h", commits: 22 },
  { hour: "68h", commits: 18 },
  { hour: "72h", commits: 10 },
];

export default function ProjectPulseLineChart() {
  return (
    <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Project Pulse - Commits Over Time
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="commits"
            stroke="#8884d8"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
