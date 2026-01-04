"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Code2, Gauge, Layers, CheckCircle } from "lucide-react";
import { generateSmartSummary, SmartSummary } from "@/lib/api";

type SummaryState =
  | "idle"
  | "scanning_structure"
  | "reading_files"
  | "complete"
  | "error";

interface Props {
  owner: string;
  repo: string;
}

export default function SmartSummaryCard({ owner, repo }: Props) {
  const [state, setState] = useState<SummaryState>("idle");
  const [summary, setSummary] = useState<SmartSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!owner || !repo) {
      setError("Please analyze a repository first");
      return;
    }

    setState("scanning_structure");
    setError(null);

    // Simulate stage progression with a delay
    setTimeout(() => {
      setState("reading_files");
    }, 2000);

    try {
      const result = await generateSmartSummary(owner, repo);
      setSummary(result);
      setState("complete");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate summary"
      );
      setState("error");
    }
  };

  const getProgressPercentage = () => {
    switch (state) {
      case "scanning_structure":
        return 35;
      case "reading_files":
        return 70;
      case "complete":
        return 100;
      default:
        return 0;
    }
  };

  const getStatusText = () => {
    switch (state) {
      case "scanning_structure":
        return "Analyzing File Structure...";
      case "reading_files":
        return "Reading Critical Files...";
      case "complete":
        return "Analysis Complete!";
      default:
        return "";
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    if (score >= 4) return "bg-orange-500";
    return "bg-red-500";
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400";
    }
  };

  return (
    <div className="w-full">
      <motion.div
        layout
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Smart Project Summary
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  AI-powered analysis
                </p>
              </div>
            </div>

            {/* Quality Score Badge (when complete) */}
            <AnimatePresence>
              {state === "complete" && summary && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    Quality
                  </span>
                  <div
                    className={`px-3 py-1 rounded-full text-white font-bold text-sm ${getQualityColor(
                      summary.code_quality_score
                    )}`}
                  >
                    {summary.code_quality_score}/10
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Idle State - Generate Button */}
          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center py-8"
              >
                <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                  Generate an AI-powered analysis of this repository&apos;s
                  architecture, tech stack, and code quality.
                </p>
                <motion.button
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Smart Summary
                </motion.button>
              </motion.div>
            )}

            {/* Loading States */}
            {(state === "scanning_structure" || state === "reading_files") && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="py-8"
              >
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {getStatusText()}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-500">
                      {getProgressPercentage()}%
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressPercentage()}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Stage Indicators */}
                <div className="flex items-center justify-center gap-8 mt-6">
                  <motion.div
                    className={`flex items-center gap-2 ${
                      state === "scanning_structure"
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-400 dark:text-zinc-600"
                    }`}
                    animate={
                      state === "scanning_structure"
                        ? { scale: [1, 1.05, 1] }
                        : {}
                    }
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Layers className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Stage 1: Structure
                    </span>
                    {state === "reading_files" && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </motion.div>
                  <motion.div
                    className={`flex items-center gap-2 ${
                      state === "reading_files"
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-400 dark:text-zinc-600"
                    }`}
                    animate={
                      state === "reading_files" ? { scale: [1, 1.05, 1] } : {}
                    }
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Code2 className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Stage 2: Deep Dive
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Complete State - Show Summary */}
            {state === "complete" && summary && (
              <motion.div
                key="complete"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                {/* Archetype Header */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="mb-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {summary.archetype}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getComplexityColor(
                        summary.complexity
                      )}`}
                    >
                      {summary.complexity} Complexity
                    </span>
                  </div>
                </motion.div>

                {/* One Liner */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="text-zinc-600 dark:text-zinc-400 text-base mb-6 leading-relaxed"
                >
                  {summary.one_liner}
                </motion.p>

                {/* Key Technologies */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge className="w-4 h-4 text-zinc-500 dark:text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Key Technologies
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {summary.key_tech.map((tech, index) => (
                      <motion.span
                        key={tech}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.5 + index * 0.05,
                        }}
                        className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium"
                      >
                        {tech}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                {/* Regenerate Button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800"
                >
                  <button
                    onClick={handleGenerate}
                    className="text-sm text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-4 h-4" />
                    Regenerate Summary
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* Error State */}
            {state === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center py-8"
              >
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <motion.button
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Sparkles className="w-5 h-5" />
                  Try Again
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
