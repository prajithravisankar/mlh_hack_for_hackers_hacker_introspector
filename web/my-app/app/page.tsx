import LanguagePieChart from "@/components/LanguagePieChart";
import CommitBarChart from "@/components/CommitBarChart";
import ProjectPulseLineChart from "@/components/ProjectPulseLineChart";
import CommitHeatmap from "@/components/CommitHeatmap";
import CommitHistogram from "@/components/CommitHistogram";
import ConsistencyRadarChart from "@/components/ConsistencyRadarChart";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Hacker Introspector
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Deep insights into your hackathon repository
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Repository Input Section */}
        <div className="mb-8 bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
          <label
            htmlFor="repo-url"
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
          >
            Repository URL
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              id="repo-url"
              placeholder="https://github.com/username/repository"
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              Analyze
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="space-y-8">
          {/* Row 1: Pie Chart and Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LanguagePieChart />
            <CommitBarChart />
          </div>

          {/* Row 2: Line Chart */}
          <div className="grid grid-cols-1">
            <ProjectPulseLineChart />
          </div>

          {/* Row 3: Heatmap */}
          <div className="grid grid-cols-1">
            <CommitHeatmap />
          </div>

          {/* Row 4: Histogram and Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CommitHistogram />
            <ConsistencyRadarChart />
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12">
        <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>Built for MLH Hack for Hackers 2026</p>
        </div>
      </footer>
    </div>
  );
}
