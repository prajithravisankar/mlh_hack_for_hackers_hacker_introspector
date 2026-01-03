"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const data = [
  { name: "TypeScript", value: 45 },
  { name: "JavaScript", value: 25 },
  { name: "Python", value: 15 },
  { name: "Go", value: 10 },
  { name: "CSS", value: 5 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function LanguagePieChart() {
  return (
    <div className="w-full h-[400px] bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Language Distribution
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} ${((percent || 0) * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
