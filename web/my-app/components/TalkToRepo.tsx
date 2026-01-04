"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Bot,
  ArrowRight,
  AlertCircle,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageCircle,
} from "lucide-react";
import FileTree from "./FileTree";
import { fetchFileTree, chatWithRepo, FileNode } from "@/lib/api";

type InteractionMode = "chat" | "talk" | null;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface TalkToRepoProps {
  repoName?: string;
  owner?: string;
  repo?: string;
}

export default function TalkToRepo({ repoName, owner, repo }: TalkToRepoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [selectedMode, setSelectedMode] = useState<InteractionMode>(null);

  // File tree state
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice call state
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

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

  const handleArrowClick = () => {
    if (selectedFiles.length > 0) {
      setShowModeSelection(true);
    }
  };

  const handleModeSelect = (mode: InteractionMode) => {
    setSelectedMode(mode);
    setShowModeSelection(false);
    if (mode === "talk") {
      setIsCallActive(true);
      setCallDuration(0);
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setSelectedMode(null);
    setCallDuration(0);
  };

  const handleBackToSelection = () => {
    setSelectedMode(null);
    setShowModeSelection(false);
  };

  // Split response into sentences (max 3)
  const splitIntoSentences = (text: string): string[] => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences.slice(0, 3).map((s) => s.trim());
  };

  // Add messages with typing animation
  const addMessagesWithTyping = async (sentences: string[]) => {
    for (let i = 0; i < sentences.length; i++) {
      setIsTyping(true);
      await new Promise((resolve) =>
        setTimeout(resolve, 600 + Math.random() * 400)
      );

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: sentences[i] },
      ]);
      setIsTyping(false);

      if (i < sentences.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending || !owner || !repo) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsSending(true);

    try {
      const response = await chatWithRepo(
        owner,
        repo,
        selectedFiles,
        userMessage,
        messages
      );

      const sentences = splitIntoSentences(response.response);
      await addMessagesWithTyping(sentences);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
                    onClick={handleArrowClick}
                    disabled={
                      selectedFiles.length === 0 || selectedMode !== null
                    }
                    className={`
                      absolute z-10 px-3 py-3 rounded-full shadow-lg
                      flex items-center gap-2 font-semibold text-sm
                      transition-all duration-300
                      ${
                        selectedFiles.length > 0 && selectedMode === null
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:shadow-xl cursor-pointer"
                          : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                      }
                    `}
                    whileHover={
                      selectedFiles.length > 0 && selectedMode === null
                        ? { scale: 1.05 }
                        : {}
                    }
                    whileTap={
                      selectedFiles.length > 0 && selectedMode === null
                        ? { scale: 0.95 }
                        : {}
                    }
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Right Panel - Mode Selection / Chat / Voice Call */}
                <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-800/30 min-h-0">
                  {/* Mode Selection Screen */}
                  <AnimatePresence mode="wait">
                    {showModeSelection && (
                      <motion.div
                        key="mode-selection"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex-1 flex flex-col items-center justify-center p-8"
                      >
                        <h5 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
                          Choose Your Mode
                        </h5>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-8 max-w-xs">
                          How would you like to interact with the selected
                          files?
                        </p>

                        <div className="flex gap-6">
                          {/* Chat Mode Option */}
                          <motion.button
                            onClick={() => handleModeSelect("chat")}
                            className="flex flex-col items-center p-6 bg-white dark:bg-zinc-800 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all w-40"
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-700 rounded-full flex items-center justify-center mb-4">
                              <MessageCircle className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
                            </div>
                            <span className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                              Chat
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                              Type messages
                            </span>
                          </motion.button>

                          {/* Talk Mode Option */}
                          <motion.button
                            onClick={() => handleModeSelect("talk")}
                            className="flex flex-col items-center p-6 bg-white dark:bg-zinc-800 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all w-40"
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-700 rounded-full flex items-center justify-center mb-4">
                              <Phone className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
                            </div>
                            <span className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                              Talk
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                              Voice conversation
                            </span>
                          </motion.button>
                        </div>

                        <button
                          onClick={() => setShowModeSelection(false)}
                          className="mt-6 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                        >
                          ← Back to file selection
                        </button>
                      </motion.div>
                    )}

                    {/* Empty State - File Selection */}
                    {!showModeSelection && selectedMode === null && (
                      <motion.div
                        key="empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center p-8"
                      >
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
                      </motion.div>
                    )}

                    {/* Chat Interface */}
                    {selectedMode === "chat" && (
                      <motion.div
                        key="chat-interface"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 flex flex-col min-h-0"
                      >
                        {/* Chat Header */}
                        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              Chat Mode
                            </span>
                          </div>
                          <button
                            onClick={handleBackToSelection}
                            className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                          >
                            Change mode
                          </button>
                        </div>

                        {/* Chat Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
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

                          {/* Conversation Messages */}
                          <AnimatePresence mode="popLayout">
                            {messages.map((message, index) => (
                              <motion.div
                                key={`message-${index}`}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{
                                  duration: 0.3,
                                  ease: "easeOut",
                                }}
                                className={`flex gap-3 ${
                                  message.role === "user"
                                    ? "flex-row-reverse"
                                    : ""
                                }`}
                              >
                                {message.role === "assistant" && (
                                  <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-full flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-white dark:text-zinc-900" />
                                  </div>
                                )}
                                <div
                                  className={`max-w-[75%] rounded-lg p-3 ${
                                    message.role === "user"
                                      ? "bg-zinc-900 dark:bg-zinc-700 text-white"
                                      : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed">
                                    {message.content}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          {/* Typing Indicator */}
                          {isTyping && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="flex gap-3"
                            >
                              <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-full flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-white dark:text-zinc-900" />
                              </div>
                              <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                                <div className="flex gap-1">
                                  <motion.div
                                    className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full"
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{
                                      duration: 0.6,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                    }}
                                  />
                                  <motion.div
                                    className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full"
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{
                                      duration: 0.6,
                                      repeat: Infinity,
                                      delay: 0.2,
                                      ease: "easeInOut",
                                    }}
                                  />
                                  <motion.div
                                    className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full"
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{
                                      duration: 0.6,
                                      repeat: Infinity,
                                      delay: 0.4,
                                      ease: "easeInOut",
                                    }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* Scroll anchor */}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shrink-0">
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Ask about the selected files..."
                              disabled={isSending}
                              className="flex-1 px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-500 disabled:opacity-50"
                            />
                            <button
                              onClick={handleSendMessage}
                              disabled={isSending || !inputValue.trim()}
                              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Voice Call Interface (WhatsApp Style) */}
                    {selectedMode === "talk" && (
                      <motion.div
                        key="voice-interface"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 flex flex-col bg-white dark:bg-zinc-900"
                      >
                        {/* Call Header */}
                        <div className="flex-1 flex flex-col items-center justify-center p-8">
                          {/* AI Avatar */}
                          <div className="relative">
                            <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-200 dark:border-zinc-700">
                              <Bot className="w-12 h-12 text-zinc-700 dark:text-zinc-300" />
                            </div>
                          </div>

                          {/* Call Info */}
                          <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-6">
                            AI Code Assistant
                          </h4>
                          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                            {isCallActive ? "Connected" : "Connecting..."}
                          </p>

                          {/* Call Duration */}
                          {isCallActive && (
                            <p className="text-zinc-700 dark:text-zinc-300 text-2xl font-mono mt-4">
                              {formatDuration(callDuration)}
                            </p>
                          )}

                          {/* Selected Files */}
                          <div className="mt-6 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                              Discussing:
                            </p>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {selectedFiles.map((file) => (
                                <span
                                  key={file}
                                  className="px-2 py-0.5 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300"
                                >
                                  {file.split("/").pop()}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Voice Activity Indicator - Static */}
                          {isCallActive && !isMuted && (
                            <div className="mt-6 flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-1 h-4 bg-green-500 rounded-full"
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Call Controls */}
                        <div className="p-6 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                          <div className="flex items-center justify-center gap-6">
                            {/* Mute Button */}
                            <button
                              onClick={() => setIsMuted(!isMuted)}
                              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                                isMuted
                                  ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-2 border-red-300 dark:border-red-500"
                                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 border-2 border-zinc-300 dark:border-zinc-600"
                              }`}
                            >
                              {isMuted ? (
                                <MicOff className="w-6 h-6" />
                              ) : (
                                <Mic className="w-6 h-6" />
                              )}
                            </button>

                            {/* End Call Button */}
                            <button
                              onClick={handleEndCall}
                              className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors border-2 border-red-600"
                            >
                              <PhoneOff className="w-7 h-7" />
                            </button>

                            {/* Speaker Button */}
                            <button
                              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                                !isSpeakerOn
                                  ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-2 border-red-300 dark:border-red-500"
                                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 border-2 border-zinc-300 dark:border-zinc-600"
                              }`}
                            >
                              {isSpeakerOn ? (
                                <Volume2 className="w-6 h-6" />
                              ) : (
                                <VolumeX className="w-6 h-6" />
                              )}
                            </button>
                          </div>

                          {/* Switch to Chat */}
                          <button
                            onClick={() => {
                              setIsCallActive(false);
                              setSelectedMode("chat");
                            }}
                            className="mt-4 w-full text-center text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                          >
                            Switch to Chat Mode
                          </button>

                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3 text-center">
                            Demo interface - Voice functionality coming soon!
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
