"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  ArrowRight,
  AlertCircle,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageCircle,
  Square,
  Loader2,
} from "lucide-react";
import { AiFillGoogleCircle } from "react-icons/ai";
import FileTree from "./FileTree";
import {
  fetchFileTree,
  chatWithRepo,
  voiceChatWithRepo,
  FileNode,
  ChatMessage as ApiChatMessage,
} from "@/lib/api";

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
  const shouldStopRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice call state
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);

  // Voice conversation state
  const [voiceHistory, setVoiceHistory] = useState<ChatMessage[]>([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [voiceStatus, setVoiceStatus] = useState<string>("Ready to start");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isProcessingRef = useRef(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, voiceHistory, currentTranscript]);

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
      setVoiceHistory([]);
      setVoiceStatus("Connecting...");
      // Start the call with AI greeting
      startVoiceConversation();
    }
  };

  const handleEndCall = () => {
    // Stop any ongoing speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsCallActive(false);
    setSelectedMode(null);
    setCallDuration(0);
    setVoiceHistory([]);
    setIsAISpeaking(false);
    setIsListening(false);
    setCurrentTranscript("");
    setVoiceStatus("Call ended");
    isProcessingRef.current = false;
  };

  const handleBackToSelection = () => {
    setSelectedMode(null);
    setShowModeSelection(false);
  };

  // ============ VOICE CONVERSATION FUNCTIONS ============

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech recognition not supported");
      setVoiceStatus("Speech recognition not supported in this browser");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus("Listening...");
    };

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setCurrentTranscript(transcript);

      // If this is a final result, process it
      if (event.results[event.results.length - 1].isFinal) {
        handleUserSpeech(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error !== "no-speech") {
        setVoiceStatus(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Don't auto-restart if we're processing or AI is speaking
      if (!isProcessingRef.current && !isAISpeaking && isCallActive) {
        setVoiceStatus("Tap mic to speak");
      }
    };

    return recognition;
  }, [isAISpeaking, isCallActive]);

  // Start listening for user speech
  const startListening = useCallback(() => {
    if (isAISpeaking || isProcessingRef.current || isMuted) return;

    if (!recognitionRef.current) {
      recognitionRef.current = initSpeechRecognition();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setCurrentTranscript("");
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  }, [isAISpeaking, isMuted, initSpeechRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  // Handle user's spoken input
  const handleUserSpeech = async (transcript: string) => {
    if (!transcript.trim() || !owner || !repo || isProcessingRef.current)
      return;

    isProcessingRef.current = true;
    stopListening();
    setVoiceStatus("Processing...");

    // Add user message to history
    const userMessage: ChatMessage = {
      role: "user",
      content: transcript.trim(),
    };
    const newHistory = [...voiceHistory, userMessage];
    setVoiceHistory(newHistory);
    setCurrentTranscript("");

    try {
      // Get AI response with audio
      setVoiceStatus("AI is thinking...");
      const response = await voiceChatWithRepo(
        owner,
        repo,
        selectedFiles,
        transcript.trim(),
        newHistory.slice(0, -1) // Send history without the current message
      );

      // Add AI response to history
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
      };
      setVoiceHistory([...newHistory, aiMessage]);

      // Play audio if available
      if (response.audio && audioRef.current && isSpeakerOn) {
        setIsAISpeaking(true);
        setVoiceStatus("AI is speaking...");

        const audioSrc = `data:audio/mpeg;base64,${response.audio}`;
        audioRef.current.src = audioSrc;

        audioRef.current.onended = () => {
          setIsAISpeaking(false);
          isProcessingRef.current = false;
          setVoiceStatus("Tap mic to speak");
          // Auto-start listening after AI finishes
          if (isCallActive && !isMuted) {
            setTimeout(() => startListening(), 500);
          }
        };

        audioRef.current.onerror = () => {
          console.error("Audio playback error");
          setIsAISpeaking(false);
          isProcessingRef.current = false;
          setVoiceStatus("Tap mic to speak");
        };

        await audioRef.current.play();
      } else {
        // No audio, just show the response
        setIsAISpeaking(false);
        isProcessingRef.current = false;
        setVoiceStatus("Tap mic to speak");
      }
    } catch (error) {
      console.error("Voice chat error:", error);
      setVoiceStatus("Error - tap mic to retry");
      isProcessingRef.current = false;
    }
  };

  // Start the voice conversation with AI greeting
  const startVoiceConversation = async () => {
    if (!owner || !repo) return;

    isProcessingRef.current = true;
    setVoiceStatus("AI is greeting you...");

    try {
      // Ask AI to introduce itself and ask what the user wants to know
      const greetingPrompt =
        "Please introduce yourself briefly and ask what the user would like to know about the selected files.";

      const response = await voiceChatWithRepo(
        owner,
        repo,
        selectedFiles,
        greetingPrompt,
        []
      );

      // Add AI greeting to history
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
      };
      setVoiceHistory([aiMessage]);

      // Play greeting audio
      if (response.audio && audioRef.current && isSpeakerOn) {
        setIsAISpeaking(true);
        setVoiceStatus("AI is speaking...");

        const audioSrc = `data:audio/mpeg;base64,${response.audio}`;
        audioRef.current.src = audioSrc;

        audioRef.current.onended = () => {
          setIsAISpeaking(false);
          isProcessingRef.current = false;
          setVoiceStatus("Tap mic to speak");
          // Auto-start listening after greeting
          if (isCallActive && !isMuted) {
            setTimeout(() => startListening(), 500);
          }
        };

        audioRef.current.onerror = () => {
          console.error("Audio playback error");
          setIsAISpeaking(false);
          isProcessingRef.current = false;
          setVoiceStatus("Tap mic to speak");
        };

        await audioRef.current.play();
      } else {
        setIsAISpeaking(false);
        isProcessingRef.current = false;
        setVoiceStatus("Tap mic to speak");
      }
    } catch (error) {
      console.error("Failed to start voice conversation:", error);
      setVoiceStatus("Failed to connect - tap mic to retry");
      isProcessingRef.current = false;
    }
  };

  // Toggle mute - stop/start listening
  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      // Resume listening if AI isn't speaking
      if (!isAISpeaking && !isProcessingRef.current) {
        setTimeout(() => startListening(), 300);
      }
    } else {
      setIsMuted(true);
      stopListening();
    }
  };

  // ============ END VOICE CONVERSATION FUNCTIONS ============

  // Split response into chunks of 1-2 sentences for human-like delivery
  // Chunk response into 1-2 sentences per bubble
  const chunkResponse = (text: string): string[] => {
    // Split by sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];

    // Group into 1-2 sentences per chunk for natural conversation flow
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();

      // If we have a next sentence and combined is not too long, pair them
      if (i < sentences.length - 1) {
        const nextSentence = sentences[i + 1].trim();
        const combined = sentence + " " + nextSentence;

        // Pair if combined is under 200 chars
        if (combined.length < 200) {
          chunks.push(combined);
          i++; // Skip next sentence since we combined it
        } else {
          chunks.push(sentence);
        }
      } else {
        chunks.push(sentence);
      }
    }

    return chunks;
  };

  // Add messages with dynamic typing animation and random delays (1-3 seconds)
  const addMessagesWithTyping = async (chunks: string[]) => {
    // Helper to sleep with cancellation check
    const sleep = (ms: number) => {
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(!shouldStopRef.current); // Return true if should continue
        }, ms);

        // Store timeout so we can clear it if needed
        if (shouldStopRef.current) {
          clearTimeout(timeout);
          resolve(false);
        }
      });
    };

    for (let i = 0; i < chunks.length; i++) {
      // Check if user wants to stop immediately
      if (shouldStopRef.current) {
        break;
      }

      setIsTyping(true);

      // Random typing delay between 1-3 seconds (1000-3000ms)
      const typingDelay = 1000 + Math.random() * 2000;
      const shouldContinue = await sleep(typingDelay);

      if (!shouldContinue) {
        setIsTyping(false);
        break;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: chunks[i] },
      ]);
      setIsTyping(false);

      // Random delay between chunks (1-3 seconds)
      if (i < chunks.length - 1) {
        const betweenDelay = 1000 + Math.random() * 2000;
        const shouldContinueAfterMessage = await sleep(betweenDelay);

        if (!shouldContinueAfterMessage) {
          break;
        }
      }
    }

    // Clean up
    setIsTyping(false);
    setIsSending(false);
    shouldStopRef.current = false;
  };

  // Handle stopping the AI response
  const handleStopResponse = () => {
    shouldStopRef.current = true;
    setIsTyping(false);
    setIsSending(false);
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending || !owner || !repo) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    shouldStopRef.current = false; // Reset stop flag
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

      const chunks = chunkResponse(response.response);
      await addMessagesWithTyping(chunks);
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
                    Select up to 10 files and have an AI-powered conversation
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
                      maxSelections={10}
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
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                          <AiFillGoogleCircle className="w-10 h-10 text-blue-500" />
                        </div>
                        <h5 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                          Select Files to Start
                        </h5>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs">
                          Choose up to 10 files from the repository tree, then
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
                            <div className="w-7 h-7 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                              <AiFillGoogleCircle className="w-5 h-5 text-white dark:text-zinc-900" />
                            </div>
                            <div className="flex-1 bg-white dark:bg-zinc-800 rounded-md p-4 border border-zinc-200 dark:border-zinc-700">
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
                                  <div className="w-7 h-7 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                                    <AiFillGoogleCircle className="w-5 h-5 text-white dark:text-zinc-900" />
                                  </div>
                                )}
                                <div
                                  className={`max-w-[75%] rounded-md p-3 ${
                                    message.role === "user"
                                      ? "bg-zinc-700 dark:bg-zinc-700 text-white"
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
                              <div className="w-7 h-7 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                                <AiFillGoogleCircle className="w-5 h-5 text-white dark:text-zinc-900" />
                              </div>
                              <div className="bg-white dark:bg-zinc-800 rounded-md p-3 border border-zinc-200 dark:border-zinc-700">
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
                            {isSending || isTyping ? (
                              <button
                                onClick={handleStopResponse}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                title="Stop generating"
                              >
                                <Square className="w-4 h-4 fill-current" />
                                <span className="text-sm font-medium">
                                  Stop
                                </span>
                              </button>
                            ) : (
                              <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim()}
                                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Voice Call Interface (Real-time Conversation) */}
                    {selectedMode === "talk" && (
                      <motion.div
                        key="voice-interface"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 flex flex-col bg-gradient-to-b from-zinc-900 to-zinc-800 min-h-0"
                      >
                        {/* Hidden audio element */}
                        <audio ref={audioRef} className="hidden" />

                        {/* Call Header */}
                        <div className="px-4 py-3 border-b border-zinc-700 bg-zinc-900/80 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  isCallActive
                                    ? "bg-green-500"
                                    : "bg-yellow-500"
                                }`}
                              />
                              {isCallActive && (
                                <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-zinc-300">
                              {isCallActive
                                ? `Call Active • ${formatDuration(
                                    callDuration
                                  )}`
                                : "Connecting..."}
                            </span>
                          </div>
                          <button
                            onClick={handleEndCall}
                            className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            End Call
                          </button>
                        </div>

                        {/* Conversation History */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                          {/* AI Avatar and status at top */}
                          <div className="flex flex-col items-center pb-4 border-b border-zinc-700/50 mb-4">
                            <div className="relative mb-3">
                              <div
                                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors ${
                                  isAISpeaking
                                    ? "bg-blue-500/20 border-blue-400"
                                    : isListening
                                    ? "bg-green-500/20 border-green-400"
                                    : "bg-zinc-700 border-zinc-600"
                                }`}
                              >
                                <AiFillGoogleCircle
                                  className={`w-10 h-10 ${
                                    isAISpeaking
                                      ? "text-blue-400"
                                      : isListening
                                      ? "text-green-400"
                                      : "text-zinc-400"
                                  }`}
                                />
                              </div>
                              {/* Speaking/Listening Animation */}
                              {(isAISpeaking || isListening) && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <motion.div
                                      key={i}
                                      className={`w-1 rounded-full ${
                                        isAISpeaking
                                          ? "bg-blue-400"
                                          : "bg-green-400"
                                      }`}
                                      animate={{
                                        height: [4, 12 + Math.random() * 8, 4],
                                      }}
                                      transition={{
                                        duration: 0.4,
                                        repeat: Infinity,
                                        delay: i * 0.1,
                                        ease: "easeInOut",
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-sm font-medium text-zinc-300">
                              AI Code Assistant
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                isAISpeaking
                                  ? "text-blue-400"
                                  : isListening
                                  ? "text-green-400"
                                  : "text-zinc-500"
                              }`}
                            >
                              {voiceStatus}
                            </p>
                          </div>

                          {/* Voice Conversation Messages */}
                          <AnimatePresence mode="popLayout">
                            {voiceHistory.map((message, index) => (
                              <motion.div
                                key={`voice-${index}`}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className={`flex gap-3 ${
                                  message.role === "user"
                                    ? "flex-row-reverse"
                                    : ""
                                }`}
                              >
                                {message.role === "assistant" && (
                                  <div className="w-7 h-7 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center justify-center shrink-0">
                                    <AiFillGoogleCircle className="w-4 h-4 text-blue-400" />
                                  </div>
                                )}
                                <div
                                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                                    message.role === "user"
                                      ? "bg-green-600 text-white rounded-br-md"
                                      : "bg-zinc-700 text-zinc-100 rounded-bl-md"
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed">
                                    {message.content}
                                  </p>
                                </div>
                                {message.role === "user" && (
                                  <div className="w-7 h-7 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center shrink-0">
                                    <Mic className="w-3 h-3 text-green-400" />
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          {/* Live Transcript (while user is speaking) */}
                          {currentTranscript && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-3 flex-row-reverse"
                            >
                              <div className="w-7 h-7 bg-green-500/30 border border-green-400 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                                <Mic className="w-3 h-3 text-green-300" />
                              </div>
                              <div className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 bg-green-600/50 border border-green-500/50">
                                <p className="text-sm text-green-100 italic">
                                  {currentTranscript}...
                                </p>
                              </div>
                            </motion.div>
                          )}

                          {/* AI Processing Indicator */}
                          {isProcessingRef.current && !isAISpeaking && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex gap-3"
                            >
                              <div className="w-7 h-7 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center justify-center shrink-0">
                                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                              </div>
                              <div className="bg-zinc-700/50 border border-zinc-600 rounded-2xl rounded-bl-md px-4 py-2.5">
                                <div className="flex gap-1">
                                  <motion.div
                                    className="w-2 h-2 bg-blue-400 rounded-full"
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{
                                      duration: 0.5,
                                      repeat: Infinity,
                                    }}
                                  />
                                  <motion.div
                                    className="w-2 h-2 bg-blue-400 rounded-full"
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{
                                      duration: 0.5,
                                      repeat: Infinity,
                                      delay: 0.15,
                                    }}
                                  />
                                  <motion.div
                                    className="w-2 h-2 bg-blue-400 rounded-full"
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{
                                      duration: 0.5,
                                      repeat: Infinity,
                                      delay: 0.3,
                                    }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* Scroll anchor */}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Selected Files Display */}
                        <div className="px-4 py-2 bg-zinc-800/80 border-t border-zinc-700/50">
                          <div className="flex items-center gap-2 overflow-x-auto">
                            <span className="text-xs text-zinc-500 shrink-0">
                              Files:
                            </span>
                            {selectedFiles.map((file) => (
                              <span
                                key={file}
                                className="px-2 py-0.5 bg-zinc-700 rounded text-xs font-mono text-zinc-400 whitespace-nowrap"
                              >
                                {file.split("/").pop()}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Call Controls */}
                        <div className="p-4 border-t border-zinc-700 bg-zinc-900 shrink-0">
                          <div className="flex items-center justify-center gap-4">
                            {/* Mute Button */}
                            <motion.button
                              onClick={handleMuteToggle}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                isMuted
                                  ? "bg-red-500/20 text-red-400 border-2 border-red-500"
                                  : "bg-zinc-700 text-zinc-200 border-2 border-zinc-600 hover:bg-zinc-600"
                              }`}
                            >
                              {isMuted ? (
                                <MicOff className="w-5 h-5" />
                              ) : (
                                <Mic className="w-5 h-5" />
                              )}
                            </motion.button>

                            {/* Main Mic Button (Push to Talk when not auto-listening) */}
                            <motion.button
                              onClick={() => {
                                if (
                                  !isListening &&
                                  !isAISpeaking &&
                                  !isProcessingRef.current
                                ) {
                                  startListening();
                                } else if (isListening) {
                                  stopListening();
                                }
                              }}
                              disabled={
                                isMuted ||
                                isAISpeaking ||
                                isProcessingRef.current
                              }
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                                isListening
                                  ? "bg-green-500 text-white border-4 border-green-300 shadow-lg shadow-green-500/50"
                                  : isAISpeaking
                                  ? "bg-blue-500/20 text-blue-400 border-2 border-blue-500 cursor-not-allowed"
                                  : isMuted || isProcessingRef.current
                                  ? "bg-zinc-700 text-zinc-500 border-2 border-zinc-600 cursor-not-allowed"
                                  : "bg-zinc-700 text-white border-2 border-zinc-500 hover:bg-zinc-600 hover:border-zinc-400"
                              }`}
                            >
                              {isListening ? (
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                >
                                  <Mic className="w-7 h-7" />
                                </motion.div>
                              ) : isAISpeaking ? (
                                <Volume2 className="w-7 h-7" />
                              ) : (
                                <Mic className="w-7 h-7" />
                              )}
                            </motion.button>

                            {/* End Call Button */}
                            <motion.button
                              onClick={handleEndCall}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors border-2 border-red-400"
                            >
                              <PhoneOff className="w-5 h-5" />
                            </motion.button>

                            {/* Speaker Button */}
                            <motion.button
                              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                !isSpeakerOn
                                  ? "bg-red-500/20 text-red-400 border-2 border-red-500"
                                  : "bg-zinc-700 text-zinc-200 border-2 border-zinc-600 hover:bg-zinc-600"
                              }`}
                            >
                              {isSpeakerOn ? (
                                <Volume2 className="w-5 h-5" />
                              ) : (
                                <VolumeX className="w-5 h-5" />
                              )}
                            </motion.button>
                          </div>

                          {/* Status Text */}
                          <p className="text-xs text-zinc-500 mt-3 text-center">
                            {isListening
                              ? "🎙️ Listening... speak now"
                              : isAISpeaking
                              ? "🔊 AI is speaking..."
                              : isMuted
                              ? "🔇 Microphone muted"
                              : "Tap the mic button to speak"}
                          </p>

                          {/* Switch to Chat */}
                          <button
                            onClick={() => {
                              handleEndCall();
                              setSelectedMode("chat");
                            }}
                            className="mt-3 w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            Switch to Chat Mode
                          </button>
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
