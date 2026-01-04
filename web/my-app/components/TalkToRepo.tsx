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
      if (transcript.trim()) {
        await processVoiceInput(transcript.trim());
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
  }, [isMuted, transcript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Process voice input
  const processVoiceInput = async (text: string) => {
    if (!text.trim() || isProcessingVoice) return;

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
      console.error("Voice chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${
            err instanceof Error ? err.message : "Failed to process"
          }`,
        },
      ]);
    } finally {
      setIsProcessingVoice(false);
      setTranscript("");
    }
  };

  // End call
  const handleEndCall = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setStep("select-files");
    setMode(null);
    setSelectedFiles([]);
    setMessages([]);
    setCallDuration(0);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isListening && !isMuted) {
      stopListening();
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    if (audioRef.current) {
      audioRef.current.volume = isSpeakerOn ? 0 : 1;
    }
  };

  // Render file selection step
  const renderFileSelection = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">
          Select Files to Discuss
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Choose up to 3 files ({selectedFiles.length}/3 selected)
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && fileTree.length > 0 && (
          <FileTree
            files={fileTree}
            selectedFiles={selectedFiles}
            onSelectionChange={setSelectedFiles}
            maxSelections={3}
          />
        )}

        {!loading && !error && fileTree.length === 0 && (
          <div className="text-gray-400 text-center py-8">
            No files found in repository
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="p-4 border-t border-gray-800">
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-2">Selected files:</p>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file) => (
                <span
                  key={file}
                  className="px-2 py-1 bg-gray-800 rounded text-xs text-white"
                >
                  {file.split("/").pop()}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={handleProceedToMode}
            className="w-full py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );

  // Render mode selection step
  const renderModeSelection = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={handleBack}
          className="text-gray-400 hover:text-white mb-2 flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
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
        <h2 className="text-lg font-semibold text-white">Choose Mode</h2>
        <p className="text-sm text-gray-400 mt-1">
          How would you like to interact?
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
        {/* Chat option */}
        <button
          onClick={() => handleStartMode("chat")}
          className="w-full max-w-xs p-6 border-2 border-gray-700 rounded-xl hover:border-white transition-colors group"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-white font-semibold text-lg">Chat</h3>
              <p className="text-gray-400 text-sm mt-1">
                Text conversation powered by Gemini AI
              </p>
            </div>
          </div>
        </button>

        {/* Talk option */}
        <button
          onClick={() => handleStartMode("talk")}
          className="w-full max-w-xs p-6 border-2 border-gray-700 rounded-xl hover:border-white transition-colors group"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-white font-semibold text-lg">Talk</h3>
              <p className="text-gray-400 text-sm mt-1">
                Voice conversation with ElevenLabs AI
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-400 text-center">
          Selected: {selectedFiles.map((f) => f.split("/").pop()).join(", ")}
        </p>
      </div>
    </div>
  );

  // Render chat interface
  const renderChatInterface = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-white"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h2 className="text-white font-semibold">Chat with Repo</h2>
            <p className="text-xs text-gray-400">
              {selectedFiles.map((f) => f.split("/").pop()).join(", ")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation about the selected files</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                msg.role === "user"
                  ? "bg-white text-black"
                  : "bg-gray-800 text-white"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-white px-4 py-2 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about the code..."
            disabled={isSending}
            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending}
            className="px-4 py-2 bg-white text-black rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );

  // Render voice call interface (WhatsApp style)
  const renderVoiceInterface = () => (
    <div className="h-full flex flex-col bg-linear-to-b from-gray-900 to-black">
      {/* Call header */}
      <div className="p-6 text-center">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        </div>
        <h2 className="text-white text-xl font-semibold">Repo Assistant</h2>
        <p className="text-green-400 text-sm mt-1">
          {isListening
            ? "Listening..."
            : isProcessingVoice
            ? "Processing..."
            : formatDuration(callDuration)}
        </p>
      </div>

      {/* Selected files */}
      <div className="px-6 mb-4">
        <p className="text-xs text-gray-400 mb-2">Discussing:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {selectedFiles.map((file) => (
            <span
              key={file}
              className="px-3 py-1 bg-gray-800/50 rounded-full text-xs text-gray-300"
            >
              {file.split("/").pop()}
            </span>
          ))}
        </div>
      </div>

      {/* Transcript / conversation area */}
      <div className="flex-1 overflow-auto px-6 pb-4">
        {messages.length > 0 && (
          <div className="space-y-3">
            {messages.slice(-4).map((msg, idx) => (
              <div
                key={idx}
                className={`text-sm ${
                  msg.role === "user" ? "text-gray-300" : "text-white"
                }`}
              >
                <span className="text-xs text-gray-500 block mb-1">
                  {msg.role === "user" ? "You" : "Assistant"}
                </span>
                <p className="bg-gray-800/30 rounded-lg px-3 py-2">
                  {msg.content.length > 150
                    ? msg.content.slice(0, 150) + "..."
                    : msg.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {transcript && (
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">You&apos;re saying:</p>
            <p className="text-white">{transcript}</p>
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="p-6 pb-8">
        <div className="flex justify-center items-center gap-8">
          {/* Mute button */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? "bg-white" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {isMuted ? (
              <svg
                className="w-6 h-6 text-black"
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

          {/* Talk button (push to talk) */}
          <button
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            disabled={isMuted || isProcessingVoice}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? "bg-green-500 scale-110"
                : isProcessingVoice
                ? "bg-yellow-500"
                : "bg-white hover:bg-gray-200"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <svg
              className={`w-10 h-10 ${
                isListening || isProcessingVoice ? "text-white" : "text-black"
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
            onClick={toggleSpeaker}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              !isSpeakerOn ? "bg-white" : "bg-gray-700 hover:bg-gray-600"
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
                className="w-6 h-6 text-black"
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
        <div className="flex justify-center mt-8">
          <button
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
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
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          {isListening ? "Release to send" : "Hold to talk"}
        </p>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="bg-black border border-gray-800 rounded-xl overflow-hidden h-[600px]">
      {step === "select-files" && renderFileSelection()}
      {step === "select-mode" && renderModeSelection()}
      {step === "active" && mode === "chat" && renderChatInterface()}
      {step === "active" && mode === "talk" && renderVoiceInterface()}
    </div>
  );
}
