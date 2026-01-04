"use client";

import { useState, useEffect } from "react";
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
  repoName?: string;
  owner?: string;
  repo?: string;
}

export default function MoreInsights({ repoName, owner, repo }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [summaryState, setSummaryState] = useState<SummaryState>("idle");
  const [summary, setSummary] = useState<SmartSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-trigger AI analysis when panel expands
  useEffect(() => {
    if (isExpanded && summaryState === "idle" && owner && repo) {
      handleGenerateSummary();
    }
  }, [isExpanded, summaryState, owner, repo]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleGenerateSummary = async () => {
    if (!owner || !repo) {
      setError("Repository information not available");
      setSummaryState("error");
      return;
    }

    setSummaryState("scanning_structure");
    setError(null);

    // Simulate stage progression
    const stageTimer = setTimeout(() => {
      setSummaryState("reading_files");
    }, 2500);

    try {
      const result = await generateSmartSummary(owner, repo);
      clearTimeout(stageTimer);
      setSummary(result);
      setSummaryState("complete");
    } catch (err) {
      clearTimeout(stageTimer);
      setError(
        err instanceof Error ? err.message : "Failed to generate summary"
      );
      setSummaryState("error");
    }
  };

  const getProgressPercentage = () => {
    switch (summaryState) {
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
    switch (summaryState) {
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

  // Helper flags for cleaner conditionals
  const isLoading =
    summaryState === "scanning_structure" || summaryState === "reading_files";
  const isScanning = summaryState === "scanning_structure";
  const isReading = summaryState === "reading_files";
  const isComplete = summaryState === "complete";
  const isError = summaryState === "error";
  const stage1Done = isReading || isComplete;

  return (
    <div className="w-full mt-8">
      <motion.div layout className="relative" initial={false}>
        <div className={`flex ${isExpanded ? "gap-6" : ""}`}>
          {/* Left Panel - Button/Collapsed State */}
          <motion.div
            layout
            className={`
              bg-zinc-900 dark:bg-zinc-800
              rounded-2xl shadow-xl overflow-hidden
              ${isExpanded ? "w-1/3" : "w-full"}
            `}
            initial={false}
            animate={{
              width: isExpanded ? "33.333%" : "100%",
            }}
            transition={{
              duration: 0.7,
              ease: [0.25, 0.1, 0.25, 1],
              opacity: { duration: 0.5 },
            }}
          >
            <div className="p-8 h-full">
              <motion.div
                layout="position"
                className={`flex flex-col ${
                  isExpanded ? "items-start" : "items-center"
                } justify-center h-full`}
              >
                {/* Icon */}
                <motion.div
                  layout="position"
                  className="mb-4"
                  transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="w-16 h-16 bg-zinc-800 dark:bg-zinc-700 rounded-full flex items-center justify-center border border-zinc-700 dark:border-zinc-600">
                    <Sparkles className="w-8 h-8 text-zinc-100" />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h3
                  layout="position"
                  transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                  className={`text-2xl font-bold text-zinc-100 mb-2 ${
                    isExpanded ? "text-left" : "text-center"
                  }`}
                >
                  {isExpanded ? "Smart Hacker Resume" : "Want AI Insights?"}
                </motion.h3>

                {/* Description */}
                <motion.p
                  layout="position"
                  transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                  className={`text-zinc-300 mb-6 ${
                    isExpanded ? "text-left text-sm" : "text-center max-w-md"
                  }`}
                >
                  {isExpanded
                    ? "2-Stage AI Pipeline analyzing your repository"
                    : "Unlock AI-powered analysis with Gemini to discover your project's architecture, tech stack, and code quality."}
                </motion.p>

                {/* Button */}
                <motion.button
                  layout="position"
                  onClick={handleToggle}
                  transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                  className={`
                    px-6 py-3 rounded-xl font-semibold transition-all duration-300
                    ${
                      isExpanded
                        ? "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 text-sm"
                        : "bg-white text-zinc-900 hover:bg-zinc-100 shadow-lg hover:shadow-xl"
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isExpanded ? "← Collapse" : "Generate Smart Hacker Resume →"}
                </motion.button>

                {/* Expanded state - Stage indicators */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.4,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                      className="mt-6 pt-6 border-t border-zinc-700 w-full"
                    >
                      <p className="text-zinc-400 text-xs mb-3">Analyzing:</p>
                      <p className="text-zinc-100 font-medium text-sm truncate mb-4">
                        {repoName || "Repository"}
                      </p>

                      {/* Stage Progress (in left panel) */}
                      {isLoading && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Layers
                              className={`w-4 h-4 ${
                                isScanning ? "text-zinc-100" : "text-green-400"
                              }`}
                            />
                            <span
                              className={`text-xs ${
                                isScanning ? "text-zinc-100" : "text-zinc-400"
                              }`}
                            >
                              Stage 1: Structure
                            </span>
                            {isReading && (
                              <CheckCircle className="w-3 h-3 text-green-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Code2
                              className={`w-4 h-4 ${
                                isReading ? "text-zinc-100" : "text-zinc-500"
                              }`}
                            />
                            <span
                              className={`text-xs ${
                                isReading ? "text-zinc-100" : "text-zinc-500"
                              }`}
                            >
                              Stage 2: Deep Dive
                            </span>
                          </div>
                        </div>
                      )}

                      {isComplete && (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Analysis Complete</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Panel - Smart Summary Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: 50, width: 0 }}
                animate={{ opacity: 1, x: 0, width: "66.666%" }}
                exit={{ opacity: 0, x: 50, width: 0 }}
                transition={{
                  duration: 0.7,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
              >
                <div className="p-8 h-full">
                  {/* Header with Quality Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      Smart Project Summary
                    </h4>

                    {/* Quality Score Badge */}
                    <AnimatePresence>
                      {summaryState === "complete" && summary && (
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

                  {/* Loading State */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12"
                    >
                      {/* Progress Bar */}
                      <div className="mb-6">
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

                      {/* Animated Stage Icons */}
                      <div className="flex items-center justify-center gap-12 mt-8">
                        <motion.div
                          className={`flex flex-col items-center gap-2 ${
                            isScanning
                              ? "text-zinc-900 dark:text-zinc-100"
                              : "text-zinc-400 dark:text-zinc-600"
                          }`}
                          animate={isScanning ? { scale: [1, 1.1, 1] } : {}}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              isScanning
                                ? "bg-zinc-900 dark:bg-zinc-100"
                                : stage1Done
                                ? "bg-green-500"
                                : "bg-zinc-200 dark:bg-zinc-700"
                            }`}
                          >
                            {stage1Done ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : (
                              <Layers
                                className={`w-6 h-6 ${
                                  isScanning
                                    ? "text-white dark:text-zinc-900"
                                    : ""
                                }`}
                              />
                            )}
                          </div>
                          <span className="text-xs font-medium">
                            Structure Scan
                          </span>
                        </motion.div>

                        {/* Connector Line */}
                        <div className="w-16 h-0.5 bg-zinc-200 dark:bg-zinc-700 relative">
                          <motion.div
                            className="absolute inset-0 bg-zinc-900 dark:bg-zinc-100"
                            initial={{ width: 0 }}
                            animate={{ width: stage1Done ? "100%" : "0%" }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>

                        <motion.div
                          className={`flex flex-col items-center gap-2 ${
                            isReading
                              ? "text-zinc-900 dark:text-zinc-100"
                              : "text-zinc-400 dark:text-zinc-600"
                          }`}
                          animate={isReading ? { scale: [1, 1.1, 1] } : {}}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              isReading
                                ? "bg-zinc-900 dark:bg-zinc-100"
                                : isComplete
                                ? "bg-green-500"
                                : "bg-zinc-200 dark:bg-zinc-700"
                            }`}
                          >
                            {isComplete ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : (
                              <Code2
                                className={`w-6 h-6 ${
                                  isReading
                                    ? "text-white dark:text-zinc-900"
                                    : ""
                                }`}
                              />
                            )}
                          </div>
                          <span className="text-xs font-medium">
                            Deep Analysis
                          </span>
                        </motion.div>
                      </div>

                      <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm mt-8">
                        {isScanning
                          ? "Gemini Flash is scanning your repository structure..."
                          : "Gemini Pro is analyzing critical files..."}
                      </p>
                    </motion.div>
                  )}

                  {/* Complete State - Show Summary */}
                  {isComplete && summary && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      {/* Archetype Header */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="mb-4"
                      >
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
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

                      {/* LaTeX Resume Entry */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.55 }}
                        className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              LaTeX Resume Entry
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(summary.latex_code);
                              // Optional: Show toast notification
                              alert("LaTeX code copied to clipboard!");
                            }}
                            className="px-2 py-1 text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded hover:opacity-80 transition-opacity font-medium"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-3 rounded border border-zinc-300 dark:border-zinc-700 overflow-auto max-h-48">
                          <code className="text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                            {summary.latex_code}
                          </code>
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
                          onClick={() => {
                            setSummaryState("idle");
                            setSummary(null);
                            handleGenerateSummary();
                          }}
                          className="text-sm text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors flex items-center gap-1"
                        >
                          <Sparkles className="w-4 h-4" />
                          Regenerate Summary
                        </button>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Error State */}
                  {isError && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                      <p className="text-red-600 dark:text-red-400 mb-4">
                        {error}
                      </p>
                      <motion.button
                        onClick={() => {
                          setSummaryState("idle");
                          handleGenerateSummary();
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Sparkles className="w-5 h-5" />
                        Try Again
                      </motion.button>
                    </motion.div>
                  )}

                  {/* Idle State (shouldn't normally show) */}
                  {!isLoading && !isComplete && !isError && isExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                        Starting AI analysis...
                      </p>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100 mx-auto" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
