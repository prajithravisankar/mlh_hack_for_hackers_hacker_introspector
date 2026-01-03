"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  repoName?: string;
}

export default function MoreInsights({ repoName }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="w-full mt-8">
      <motion.div layout className="relative" initial={false}>
        <div className={`flex ${isExpanded ? "gap-6" : ""}`}>
          {/* Left Panel - Button/Collapsed State */}
          <motion.div
            layout
            className={`
              bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700
              rounded-2xl shadow-xl overflow-hidden
              ${isExpanded ? "w-1/3" : "w-full"}
            `}
            initial={false}
            animate={{
              width: isExpanded ? "33.333%" : "100%",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
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
                <motion.div layout="position" className="mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h3
                  layout="position"
                  className={`text-2xl font-bold text-white mb-2 ${
                    isExpanded ? "text-left" : "text-center"
                  }`}
                >
                  {isExpanded ? "AI Insights" : "Want Deeper Insights?"}
                </motion.h3>

                {/* Description */}
                <motion.p
                  layout="position"
                  className={`text-white/80 mb-6 ${
                    isExpanded ? "text-left text-sm" : "text-center max-w-md"
                  }`}
                >
                  {isExpanded
                    ? "AI-powered analysis of your repository patterns and recommendations."
                    : "Unlock AI-powered analysis to discover hidden patterns, get actionable recommendations, and understand your project's health at a deeper level."}
                </motion.p>

                {/* Button */}
                <motion.button
                  layout="position"
                  onClick={handleToggle}
                  className={`
                    px-6 py-3 rounded-xl font-semibold transition-all
                    ${
                      isExpanded
                        ? "bg-white/20 hover:bg-white/30 text-white text-sm"
                        : "bg-white text-indigo-700 hover:bg-white/90 shadow-lg hover:shadow-xl"
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isExpanded ? "← Collapse" : "More Insights →"}
                </motion.button>

                {/* Expanded state additional info */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ delay: 0.2 }}
                      className="mt-6 pt-6 border-t border-white/20 w-full"
                    >
                      <p className="text-white/60 text-xs mb-3">Analyzing:</p>
                      <p className="text-white font-medium text-sm truncate">
                        {repoName || "Repository"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Panel - Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: 50, width: 0 }}
                animate={{ opacity: 1, x: 0, width: "66.666%" }}
                exit={{ opacity: 0, x: 50, width: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="p-8 h-full">
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
                    AI-Powered Analysis
                  </h4>

                  {/* Insights Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Insight Card 1 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-green-600 dark:text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                            Code Quality
                          </h5>
                          <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-1">
                            Consistent commit patterns detected. Good
                            collaboration practices observed.
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Insight Card 2 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
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
                        <div>
                          <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                            Bus Factor Alert
                          </h5>
                          <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-1">
                            Consider distributing knowledge across more team
                            members.
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Insight Card 3 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-blue-600 dark:text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                            Activity Trend
                          </h5>
                          <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-1">
                            Peak activity detected in afternoon hours. Team is
                            most productive 2-6pm.
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Insight Card 4 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-purple-600 dark:text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                            Tech Stack
                          </h5>
                          <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-1">
                            Modern tech stack detected. Dependencies are up to
                            date.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Coming Soon Badge */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                        Coming Soon
                      </span>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        Deep AI analysis with Gemini integration for
                        personalized recommendations
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
