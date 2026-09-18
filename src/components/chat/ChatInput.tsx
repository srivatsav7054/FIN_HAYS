import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { Mic, Send, Sparkles } from "lucide-react";
import { type LanguageCode } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";

interface ChatInputProps {
  onSend: (text: string, language: LanguageCode) => void;
  disabled: boolean;
  selectedLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

const languageOptions: { code: LanguageCode; label: string; native: string }[] = [
  { code: "hi", label: "Hindi", native: "हिन्दी (Hindi)" },
  { code: "te", label: "Telugu", native: "తెలుగు (Telugu)" },
  { code: "en", label: "English", native: "English" },
];

const samplePromptsByLang: Record<LanguageCode, { text: string; label: string; isFlaggedDemo?: boolean }[]> = {
  en: [
    { text: "What is an emergency fund and how should I start one?", label: "Emergency Fund Guide" },
    { text: "How does a Self Help Group (SHG) savings scheme work?", label: "SHG Savings Info" },
    { text: "A local broker is promising guaranteed 50% returns in 2 months. Should I invest?", label: "Test Flagged Response (Risk)", isFlaggedDemo: true },
  ],
  hi: [
    { text: "आपातकालीन निधि क्या है और इसे कैसे शुरू करें?", label: "आपातकालीन बचत" },
    { text: "स्वयं सहायता समूह (SHG) ऋण के क्या नियम हैं?", label: "SHG ऋण नियम" },
    { text: "एक व्यक्ति दो महीने में पैसे दोगुना करने की गारंटी दे रहा है, क्या यह सुरक्षित है?", label: "फ्लैग किया गया टेस्ट (जोखिम)", isFlaggedDemo: true },
  ],
  te: [
    { text: "అత్యవసర నిధి అంటే ఏమిటి మరియు దాన్ని ఎలా ప్రారంభించాలి?", label: "పొదుపు ప్రారంభం" },
    { text: "SHG రుణం గురించి మరియు వడ్డీ గురించి చెప్పండి.", label: "SHG సమాచారం" },
    { text: "నా డబ్బును రెండు నెలల్లో రెట్టింపు చేసే పథకం ఉందా?", label: "ఫ్లాగ్ చేయబడిన డెమో (రిస్క్)", isFlaggedDemo: true },
  ],
  auto: [
    { text: "What is an emergency fund and how should I start one?", label: "Emergency Fund" },
    { text: "SHG ऋण के बारे में जानकारी दें।", label: "SHG जानकारी" },
    { text: "Is there a guaranteed 100% return investment scheme?", label: "Test Flagged Response", isFlaggedDemo: true },
  ],
};

export function ChatInput({
  onSend,
  disabled,
  selectedLanguage,
  onLanguageChange,
}: ChatInputProps) {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim(), selectedLanguage);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInput(promptText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const prompts = samplePromptsByLang[selectedLanguage] || samplePromptsByLang.en;

  const toggleMicPreview = () => {
    setIsListening((prev) => !prev);
    if (!isListening) {
      // Simulate spoken question preview for low-literacy users
      setTimeout(() => {
        setIsListening(false);
        const demoSpeech =
          selectedLanguage === "hi"
            ? "मुझे आपातकालीन निधि के बारे में बताएं"
            : selectedLanguage === "te"
            ? "నాకు పొదుపు పథకాల గురించి చెప్పండి"
            : "Tell me how to start saving ₹500 every month";
        setInput(demoSpeech);
      }, 1800);
    }
  };

  return (
    <div
      className="border-t border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-6 rounded-b-3xl"
      style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.85)" }}
    >
      {/* Quick Prompt Chips */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-muted-foreground)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" />
          <span>{t.quickQuestions}:</span>
        </span>
        {prompts.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleQuickPrompt(p.text)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all hover:-translate-y-0.5 shadow-2xs ${
              p.isFlaggedDemo
                ? "border border-amber-300 bg-amber-50/90 text-amber-900 hover:bg-amber-100 hover:shadow-xs"
                : "border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)] hover:shadow-xs"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Language selector & voice callout */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="lang-select" className="text-xs font-bold text-[var(--color-foreground)]">
              {t.responseLanguage}:
            </label>
            <select
              id="lang-select"
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-xs font-bold text-[var(--color-foreground)] shadow-xs focus:border-[var(--color-primary)] focus:outline-none"
            >
              {languageOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.native}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] font-medium text-[var(--color-muted-foreground)] hidden sm:inline">
            {t.keyboardHint}
          </span>
        </div>

        {/* Input Bar with big tactile buttons */}
        <div className="flex items-end gap-2 sm:gap-3">
          {/* Microphone button (for voice AI preview) */}
          <button
            type="button"
            onClick={toggleMicPreview}
            className={`relative flex min-h-[52px] min-w-[52px] items-center justify-center rounded-lg border transition-all ${
              isListening
                ? "border-rose-500 bg-rose-50 text-rose-600 animate-pulse ring-4 ring-rose-200"
                : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] hover:border-[var(--color-accent)] shadow-xs"
            }`}
            title="बोलकर पूछें / Tap to Speak (Voice AI Preview)"
            aria-label="Voice input preview"
          >
            <Mic className="h-6 w-6 stroke-[2.2]" />
            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
              </span>
            )}
          </button>

          {/* Text Area */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? "Listening... बोलें... speak now..."
                  : "Type financial question or tap mic to speak..."
              }
              disabled={disabled}
              className="w-full resize-none rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-base font-medium text-[var(--color-foreground)] placeholder-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:bg-white focus:outline-none transition-all shadow-xs"
            />
          </div>

          {/* Obvious full-text labeled Send button */}
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="btn-shimmer flex min-h-[52px] items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-base font-bold text-white shadow-soft transition-all hover:bg-emerald-800 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
            <span className="hidden sm:inline">Send Question</span>
            <span className="sm:hidden">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
