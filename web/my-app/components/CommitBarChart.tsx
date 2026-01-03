"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  { contributor: "Alice", commits: 45 },
  { contributor: "Bob", commits: 32 },
  { contributor: "Charlie", commits: 28 },
  { contributor: "David", commits: 15 },
  { contributor: "Eve", commits: 12 },
];

export default function CommitBarChart() {
  return (
    <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Commit Count by Contributors
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="contributor" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="commits" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
