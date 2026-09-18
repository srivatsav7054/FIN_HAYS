import { useState } from "react";
import { motion } from "framer-motion";
import { Sprout, User, Volume2, VolumeX, Copy, Check } from "lucide-react";
import { SourcesList } from "./SourcesList";
import { FlaggedCard } from "./FlaggedCard";

export interface ChatMessageData {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: string;
  sources?: string[];
  flagged?: boolean;
}

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard fail
    }
  };

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.text);
    
    // Auto-select Indian English or Hindi voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.includes("en-IN") || v.lang.includes("hi") || v.lang.includes("te")
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 0.95;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Left Avatar for Agent */}
      {!isUser && (
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-soft">
          <Sprout className="h-5 w-5" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`max-w-[88%] sm:max-w-[78%] ${
          isUser
            ? "flex flex-col items-end"
            : "flex flex-col items-start"
        }`}
      >
        {isUser ? (
          <div className="rounded-2xl rounded-tr-none bg-[var(--color-primary)] px-4 sm:px-5 py-3.5 text-white shadow-soft">
            <p className="whitespace-pre-wrap text-base font-medium leading-relaxed">
              {message.text}
            </p>
            <div className="mt-1.5 flex justify-end text-[11px] text-emerald-100/90 font-mono">
              {formattedTime}
            </div>
          </div>
        ) : message.flagged ? (
          <div className="w-full">
            <FlaggedCard>
              <div className="flex items-center justify-between gap-2 mb-2 border-b border-amber-300/60 pb-2">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  Protected Guidance
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleSpeak}
                    className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold transition-all ${
                      isPlaying
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-amber-200/80 text-amber-950 hover:bg-amber-300"
                    }`}
                    title={isPlaying ? "Stop audio" : "Listen in Voice (सुनें)"}
                  >
                    {isPlaying ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    <span>{isPlaying ? "Stop" : "Listen"}</span>
                    {isPlaying && (
                      <span className="flex items-center gap-0.5 ml-1">
                        <span className="h-2.5 w-0.5 bg-white animate-pulse" />
                        <span className="h-3.5 w-0.5 bg-white animate-pulse [animation-delay:150ms]" />
                        <span className="h-2 w-0.5 bg-white animate-pulse [animation-delay:300ms]" />
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg p-1.5 text-amber-900 hover:bg-amber-200 transition-colors"
                    title="Copy response"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <p className="whitespace-pre-wrap text-base font-normal leading-relaxed text-amber-950">
                {message.text}
              </p>
              {message.sources && message.sources.length > 0 && (
                <SourcesList sources={message.sources} />
              )}
              <div className="mt-2.5 text-right text-[11px] font-mono text-amber-800">
                {formattedTime}
              </div>
            </FlaggedCard>
          </div>
        ) : (
          <div
            className="surface-card w-full rounded-2xl rounded-tl-none px-5 py-4"
            style={{
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 4px 18px -4px rgba(45, 38, 25, 0.08)",
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[var(--color-border)]/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[var(--color-primary)]">Sahaara AI Mitra</span>
                <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
                  Verified Guide
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSpeak}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                    isPlaying
                      ? "bg-[var(--color-primary)] text-white shadow-xs"
                      : "bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-emerald-200/70"
                  }`}
                  title={isPlaying ? "Stop audio" : "Listen to Voice Guidance (सुनें)"}
                >
                  {isPlaying ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  <span>{isPlaying ? "Stop" : "Listen"}</span>
                  {isPlaying && (
                    <span className="flex items-center gap-0.5 ml-1">
                      <span className="h-2.5 w-0.5 bg-white animate-pulse" />
                      <span className="h-3.5 w-0.5 bg-white animate-pulse [animation-delay:150ms]" />
                      <span className="h-2 w-0.5 bg-white animate-pulse [animation-delay:300ms]" />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
                  title="Copy guidance"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <p className="whitespace-pre-wrap text-base font-normal leading-relaxed text-[var(--color-foreground)]">
              {message.text}
            </p>

            {message.sources && message.sources.length > 0 && (
              <SourcesList sources={message.sources} />
            )}

            <div className="mt-2.5 text-right text-[11px] font-mono text-[var(--color-muted-foreground)]">
              {formattedTime}
            </div>
          </div>
        )}
      </div>

      {/* Right Avatar for User */}
      {isUser && (
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-secondary)] text-[var(--color-foreground)] border border-[var(--color-border)] shadow-2xs">
          <User className="h-5 w-5" />
        </div>
      )}
    </motion.div>
  );
}
