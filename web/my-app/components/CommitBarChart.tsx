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
import { ContributorData } from "@/types/charts";

interface Props {
  data: ContributorData[];
}

export default function CommitBarChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm flex items-center justify-center">
        <p className="text-zinc-500">No contributor data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Commit Count by Contributors
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis
            dataKey="contributor"
            type="category"
            width={100}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Legend />
          <Bar dataKey="commits" fill="#8884d8" name="Commits" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
