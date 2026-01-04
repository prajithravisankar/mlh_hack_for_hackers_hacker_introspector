"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import FileTree from "./FileTree";
import {
  fetchFileTree,
  chatWithRepo,
  voiceChatWithRepo,
  FileNode,
} from "../lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type Mode = "chat" | "talk";
type Step = "select-files" | "select-mode" | "active";

// Speech Recognition Types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export default function TalkToRepo({
  owner,
  repo,
}: {
  owner: string;
  repo: string;
}) {
  // State
  const [step, setStep] = useState<Step>("select-files");
  const [mode, setMode] = useState<Mode | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice state
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch file tree on mount
  useEffect(() => {
    async function loadFileTree() {
      setLoading(true);
      setError(null);
      try {
        const tree = await fetchFileTree(owner, repo);
        setFileTree(tree || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load file tree"
        );
        setFileTree([]);
      } finally {
        setLoading(false);
      }
    }
    loadFileTree();
  }, [owner, repo]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Call timer
  useEffect(() => {
    if (step === "active" && mode === "talk") {
      callTimerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [step, mode]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";
      }
    }
  }, []);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // File selection handlers
  const handleFileSelect = (path: string) => {
    setSelectedFiles((prev) => {
      if (prev.includes(path)) {
        return prev.filter((p) => p !== path);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, path];
    });
  };

  // Proceed to mode selection
  const handleProceedToMode = () => {
    if (selectedFiles.length > 0) {
      setStep("select-mode");
    }
  };

  // Start chat or talk
  const handleStartMode = (selectedMode: Mode) => {
    setMode(selectedMode);
    setStep("active");
    setMessages([]);
    setCallDuration(0);
  };

  // Go back
  const handleBack = () => {
    if (step === "select-mode") {
      setStep("select-files");
    } else if (step === "active") {
      setStep("select-mode");
      setMode(null);
      setMessages([]);
      setCallDuration(0);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  // Send chat message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsSending(true);

    try {
      const response = await chatWithRepo(
        owner,
        repo,
        selectedFiles,
        userMessage
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.response },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${
            err instanceof Error ? err.message : "Failed to get response"
          }`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press in chat input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Play audio from base64
  const playAudio = useCallback(
    (audioBase64: string) => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      audioRef.current = audio;
      audio.volume = isSpeakerOn ? 1 : 0;
      audio.play().catch(console.error);
    },
    [isSpeakerOn]
  );

  // Process voice input
  const processVoiceInput = useCallback(
    async (text: string) => {
      setIsProcessingVoice(true);
      setMessages((prev) => [...prev, { role: "user", content: text }]);

      try {
        const response = await voiceChatWithRepo(
          owner,
          repo,
          selectedFiles,
          text
        );
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.response },
        ]);
        if (response.audio) {
          playAudio(response.audio);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${
              err instanceof Error ? err.message : "Failed to get response"
            }`,
          },
        ]);
      } finally {
        setIsProcessingVoice(false);
        setTranscript("");
      }
    },
    [owner, repo, selectedFiles, playAudio]
  );

  // Voice recognition handlers
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isMuted) return;

    setIsListening(true);
    setTranscript("");

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognitionRef.current.onend = async () => {
      setIsListening(false);
      const currentTranscript = transcript;
      if (currentTranscript.trim()) {
        await processVoiceInput(currentTranscript.trim());
      }
    };

    recognitionRef.current.onerror = (event: { error: string }) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  }, [isMuted, transcript, processVoiceInput]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // End call
  const endCall = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    handleBack();
  };

  // ===================
  // RENDER
  // ===================

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading repository structure...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // =========================================
  // STEP 1: SELECT FILES (Split View Design)
  // =========================================
  if (step === "select-files") {
    return (
      <div className="h-[600px] flex border border-gray-200 rounded-xl overflow-hidden bg-white">
        {/* Left Panel: File Tree */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Repository Files</h3>
            <p className="text-sm text-gray-500 mt-1">
              Select up to 3 files to chat about
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <FileTree
              files={fileTree}
              selectedFiles={selectedFiles}
              onSelectionChange={(files) => setSelectedFiles(files)}
              maxSelections={3}
            />
          </div>
        </div>

        {/* Center: Arrow Button */}
        <div className="flex items-center justify-center px-2 bg-gray-50">
          <button
            onClick={handleProceedToMode}
            disabled={selectedFiles.length === 0}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center
              transition-all duration-300 ease-in-out
              ${
                selectedFiles.length > 0
                  ? "bg-black text-white hover:bg-gray-800 cursor-pointer shadow-lg hover:scale-110"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
            title={
              selectedFiles.length > 0
                ? "Continue to mode selection"
                : "Select at least one file"
            }
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Right Panel: Selected Files */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Selected Files</h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedFiles.length}/3 files selected
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg
                  className="w-16 h-16 mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-center">
                  Click files on the left to select them
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={file}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-medium mr-3 shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700 truncate font-mono">
                        {file}
                      </span>
                    </div>
                    <button
                      onClick={() => handleFileSelect(file)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-2 shrink-0"
                      title="Remove file"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // STEP 2: SELECT MODE (Modal/Dialog Style)
  // =========================================
  if (step === "select-mode") {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="flex items-center text-gray-500 hover:text-black transition-colors mb-6"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to file selection
          </button>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            How would you like to interact?
          </h2>
          <p className="text-gray-500 text-center mb-8">
            Choose your preferred way to explore these files
          </p>

          {/* Selected files summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">Selected files:</p>
            <div className="space-y-1">
              {selectedFiles.map((file) => (
                <p
                  key={file}
                  className="text-sm font-mono text-gray-700 truncate"
                >
                  {file}
                </p>
              ))}
            </div>
          </div>

          {/* Mode options */}
          <div className="space-y-4">
            {/* Chat option */}
            <button
              onClick={() => handleStartMode("chat")}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-black hover:bg-gray-50 transition-all group text-left"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-black flex items-center justify-center transition-colors mr-4">
                  <svg
                    className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-black">
                    Chat
                  </h3>
                  <p className="text-sm text-gray-500">
                    Text-based conversation about the code
                  </p>
                </div>
              </div>
            </button>

            {/* Talk option */}
            <button
              onClick={() => handleStartMode("talk")}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-black hover:bg-gray-50 transition-all group text-left"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-black flex items-center justify-center transition-colors mr-4">
                  <svg
                    className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-black">
                    Talk
                  </h3>
                  <p className="text-sm text-gray-500">
                    Voice conversation with AI responses
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // STEP 3: ACTIVE - CHAT MODE
  // =========================================
  if (step === "active" && mode === "chat") {
    return (
      <div className="h-[600px] flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-black transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">Chat with Repo</h3>
            <p className="text-xs text-gray-500">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}{" "}
              selected
            </p>
          </div>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg
                className="w-16 h-16 mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-center">
                Start a conversation about the selected files
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-black text-white rounded-br-md"
                      : "bg-gray-100 text-gray-900 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about the code..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-black transition-colors"
              disabled={isSending}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSending}
              className={`p-3 rounded-full transition-all ${
                inputValue.trim() && !isSending
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // STEP 3: ACTIVE - TALK MODE (WhatsApp-style)
  // =========================================
  if (step === "active" && mode === "talk") {
    return (
      <div className="h-[600px] flex flex-col bg-linear-to-b from-gray-900 to-black rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">
            AI Code Assistant
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {formatDuration(callDuration)}
          </p>
        </div>

        {/* Transcript/Status Area */}
        <div className="flex-1 px-6 overflow-y-auto">
          <div className="max-w-sm mx-auto">
            {isListening && (
              <div className="text-center mb-4">
                <div className="inline-flex items-center px-4 py-2 bg-green-500/20 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
                  <span className="text-green-400 text-sm">Listening...</span>
                </div>
              </div>
            )}
            {isProcessingVoice && (
              <div className="text-center mb-4">
                <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-full">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2" />
                  <span className="text-blue-400 text-sm">Processing...</span>
                </div>
              </div>
            )}
            {transcript && (
              <div className="bg-white/10 rounded-lg p-3 mb-4">
                <p className="text-white text-sm">{transcript}</p>
              </div>
            )}
            {/* Recent messages */}
            <div className="space-y-3">
              {messages.slice(-4).map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-white/10 text-white"
                      : "bg-gray-700 text-gray-100"
                  }`}
                >
                  <p className="text-xs text-gray-400 mb-1">
                    {msg.role === "user" ? "You" : "AI"}
                  </p>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-8">
          <div className="flex items-center justify-center space-x-6">
            {/* Mute button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? "bg-red-500" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {isMuted ? (
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              )}
            </button>

            {/* Push to talk button */}
            <button
              onMouseDown={startListening}
              onMouseUp={stopListening}
              onMouseLeave={stopListening}
              onTouchStart={startListening}
              onTouchEnd={stopListening}
              disabled={isMuted || isProcessingVoice}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? "bg-green-500 scale-110"
                  : isMuted || isProcessingVoice
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              <svg
                className={`w-8 h-8 ${
                  isListening ? "text-white" : "text-gray-900"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </button>

            {/* Speaker button */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                !isSpeakerOn ? "bg-red-500" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {isSpeakerOn ? (
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* End call button */}
          <div className="mt-6 text-center">
            <button
              onClick={endCall}
              className="w-14 h-14 mx-auto rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
                />
              </svg>
            </button>
            <p className="text-gray-400 text-xs mt-2">End Call</p>
          </div>

          {/* Instructions */}
          <p className="text-gray-500 text-xs text-center mt-4">
            Hold the center button to speak
          </p>
        </div>
      </div>
    );
  }

  return null;
}
