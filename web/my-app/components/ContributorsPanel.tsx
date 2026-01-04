"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ContributorData } from "@/types/charts";

interface Props {
  data: ContributorData[];
  totalCommits: number;
}

type ViewMode = "chart" | "list";
type SortBy = "commits" | "name";

export default function ContributorsPanel({ data, totalCommits }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("commits");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and sort contributors
  const filteredData = useMemo(() => {
    let result = [...data];

    // Filter by search
    if (searchQuery) {
      result = result.filter((c) =>
        c.contributor.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === "name") {
      result.sort((a, b) => a.contributor.localeCompare(b.contributor));
    } else {
      result.sort((a, b) => b.commits - a.commits);
    }

    return result;
  }, [data, searchQuery, sortBy]);

  // Data for chart (top 10 or all)
  const chartData = showAll ? filteredData : filteredData.slice(0, 10);

  // Color palette for bars
  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#0088FE",
    "#00C49F",
    "#FFBB28",
  ];

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm flex items-center justify-center h-[400px]">
        <p className="text-zinc-500">No contributor data available</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Contributors
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            {data.length} contributors • {totalCommits.toLocaleString()} total
            commits
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden">
            <button
              onClick={() => setViewMode("chart")}
              className={`px-3 py-1.5 text-sm ${
                viewMode === "chart"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              }`}
            >
              📊 Chart
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-sm border-l border-zinc-300 dark:border-zinc-700 ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              }`}
            >
              📋 List
            </button>
          </div>
        </div>
      </div>

      {/* Search and Sort (visible in list mode or when showing all) */}
      {(viewMode === "list" || showAll) && (
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search contributors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="commits">Most Commits</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* Chart View */}
      {viewMode === "chart" && (
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 20, right: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" />
              <YAxis
                dataKey="contributor"
                type="category"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ContributorData;
                    const percentage = (
                      (data.commits / totalCommits) *
                      100
                    ).toFixed(1);
                    return (
                      <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-2 mb-2">
                          {data.avatar_url && (
                            <img
                              src={data.avatar_url}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {data.contributor}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {data.commits.toLocaleString()} commits ({percentage}
                          %)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="commits" name="Commits">
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="max-h-[350px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-zinc-900">
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="text-left py-2 px-2 text-sm font-medium text-zinc-500">
                  #
                </th>
                <th className="text-left py-2 px-2 text-sm font-medium text-zinc-500">
                  Contributor
                </th>
                <th className="text-right py-2 px-2 text-sm font-medium text-zinc-500">
                  Commits
                </th>
                <th className="text-right py-2 px-2 text-sm font-medium text-zinc-500">
                  Share
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((contributor, index) => {
                const percentage = (
                  (contributor.commits / totalCommits) *
                  100
                ).toFixed(1);
                return (
                  <tr
                    key={contributor.contributor}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="py-2 px-2 text-sm text-zinc-500">
                      {index + 1}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        {contributor.avatar_url ? (
                          <img
                            src={contributor.avatar_url}
                            alt=""
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        )}
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {contributor.contributor}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right text-sm text-zinc-900 dark:text-zinc-100">
                      {contributor.commits.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-500 w-12 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <p className="text-center py-8 text-zinc-500">
              No contributors match your search
            </p>
          )}
        </div>
      )}

      {/* Show more/less toggle for chart view */}
      {viewMode === "chart" && data.length > 10 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showAll
              ? `Show Top 10 Only`
              : `Show All ${data.length} Contributors`}
          </button>
        </div>
      )}
    </div>
  );
}
