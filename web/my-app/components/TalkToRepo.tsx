"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Bot,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import FileTree from "./FileTree";
import { fetchFileTree, FileNode } from "@/lib/api";

interface TalkToRepoProps {
  repoName?: string;
  owner?: string;
  repo?: string;
}

export default function TalkToRepo({ repoName, owner, repo }: TalkToRepoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [chatStarted, setChatStarted] = useState(false);

  // File tree state
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  // Fetch file tree when expanded
  const loadFileTree = useCallback(async () => {
    if (!owner || !repo) {
      setTreeError("Repository information not available");
      return;
    }

    setIsLoadingTree(true);
    setTreeError(null);

    try {
      const tree = await fetchFileTree(owner, repo);
      setFileTree(tree);
    } catch (err) {
      console.error("Failed to fetch file tree:", err);
      setTreeError(
        err instanceof Error ? err.message : "Failed to load file tree"
      );
    } finally {
      setIsLoadingTree(false);
    }
  }, [owner, repo]);

  // Load file tree when panel is expanded
  useEffect(() => {
    if (isExpanded && fileTree.length === 0 && !isLoadingTree && !treeError) {
      loadFileTree();
    }
  }, [isExpanded, fileTree.length, isLoadingTree, treeError, loadFileTree]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStartChat = () => {
    if (selectedFiles.length > 0) {
      setChatStarted(true);
    }
  };

  return (
    <div className="w-full mt-8">
      <motion.div layout className="relative" initial={false}>
        {/* Collapsed State - Button */}
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-zinc-900 dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex flex-col items-center justify-center">
                  {/* Icon */}
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-zinc-800 dark:bg-zinc-700 rounded-full flex items-center justify-center border border-zinc-700 dark:border-zinc-600">
                      <MessageSquare className="w-8 h-8 text-zinc-100" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-zinc-100 mb-2 text-center">
                    Talk to the Repo
                  </h3>

                  {/* Description */}
                  <p className="text-zinc-300 mb-6 text-center max-w-md">
                    Select up to 3 files and have an AI-powered conversation
                    about your code. Get explanations, suggestions, and
                    insights.
                  </p>

                  {/* Button */}
                  <motion.button
                    onClick={handleToggle}
                    className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 bg-white text-zinc-900 hover:bg-zinc-100 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start Conversation →
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded State - Split View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Talk to the Repo
                  </h4>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    — {repoName || "Repository"}
                  </span>
                </div>
                <button
                  onClick={handleToggle}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  ← Collapse
                </button>
              </div>

              {/* Main Content - Split View */}
              <div className="flex h-[500px]">
                {/* Left Panel - File Tree */}
                <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-700 flex flex-col">
                  {treeError ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-4">
                      <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
                      <p className="text-sm text-red-600 dark:text-red-400 text-center mb-3">
                        {treeError}
                      </p>
                      <button
                        onClick={loadFileTree}
                        className="px-4 py-2 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <FileTree
                      files={fileTree}
                      selectedFiles={selectedFiles}
                      onSelectionChange={setSelectedFiles}
                      maxSelections={3}
                      isLoading={isLoadingTree}
                    />
                  )}
                </div>

                {/* Vertical Separator with Button */}
                <div className="relative flex items-center justify-center">
                  {/* The actual separator line is in the border of left/right panels */}
                  <motion.button
                    onClick={handleStartChat}
                    disabled={selectedFiles.length === 0}
                    className={`
                      absolute z-10 px-3 py-3 rounded-full shadow-lg
                      flex items-center gap-2 font-semibold text-sm
                      transition-all duration-300
                      ${
                        selectedFiles.length > 0
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:shadow-xl cursor-pointer"
                          : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                      }
                    `}
                    whileHover={selectedFiles.length > 0 ? { scale: 1.05 } : {}}
                    whileTap={selectedFiles.length > 0 ? { scale: 0.95 } : {}}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Right Panel - Chat Area */}
                <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-800/30">
                  {!chatStarted ? (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                      <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center mb-4">
                        <Bot className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                      </div>
                      <h5 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                        Select Files to Start
                      </h5>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs">
                        Choose up to 3 files from the repository tree, then
                        click the arrow button to begin your conversation.
                      </p>

                      {/* Selected files preview */}
                      {selectedFiles.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 w-full max-w-sm"
                        >
                          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-2">
                            Selected for Discussion
                          </p>
                          <div className="space-y-1">
                            {selectedFiles.map((file) => (
                              <div
                                key={file}
                                className="text-sm font-mono text-zinc-700 dark:text-zinc-300 truncate"
                              >
                                {file}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    /* Chat Interface (Placeholder) */
                    <div className="flex-1 flex flex-col">
                      {/* Chat Messages Area */}
                      <div className="flex-1 overflow-auto p-4 space-y-4">
                        {/* System Message */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3"
                        >
                          <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-full flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-white dark:text-zinc-900" />
                          </div>
                          <div className="flex-1 bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">
                              I&apos;ve loaded{" "}
                              <strong>{selectedFiles.length} file(s)</strong>{" "}
                              from the repository. What would you like to know
                              about them?
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {selectedFiles.map((file) => (
                                <span
                                  key={file}
                                  className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded text-xs font-mono text-zinc-600 dark:text-zinc-400"
                                >
                                  {file.split("/").pop()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>

                        {/* Placeholder suggestions */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex flex-wrap gap-2 px-11"
                        >
                          {[
                            "Explain this code",
                            "Find potential bugs",
                            "Suggest improvements",
                            "What does this do?",
                          ].map((suggestion) => (
                            <button
                              key={suggestion}
                              className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </motion.div>
                      </div>

                      {/* Chat Input */}
                      <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Ask about the selected files..."
                            className="flex-1 px-4 py-2 text-sm font-mono border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-500"
                          />
                          <button className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity">
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 text-center">
                          This is a demo interface. Chat functionality coming
                          soon!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
