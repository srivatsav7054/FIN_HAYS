import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { postAgentQuery } from "@/api/agent";
import { ChatMessage, type ChatMessageData } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatStatusBadge, type AiStatusState } from "@/components/chat/ChatStatusBadge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { type LanguageCode } from "@/types";
import { ChartNoAxesCombined, Info, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
});

const initialMessages: ChatMessageData[] = [
  {
    id: "msg-1",
    role: "user",
    text: "What is an emergency fund and how can I start saving for it?",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "msg-2",
    role: "agent",
    text: "An emergency fund is money kept aside for unexpected expenses like illness, sudden travel, or repairs. Based on the information provided, one possible approach is to set aside a small fixed amount each week, even ₹100, so it grows steadily without putting strain on your daily budget.",
    timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    sources: ["NCFE Savings Guide", "Financial Education Material"],
    flagged: false,
  },
  {
    id: "msg-3",
    role: "user",
    text: "Someone in my village says there is an investment that guarantees doubling my money in 3 months. Is that true?",
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: "msg-4",
    role: "agent",
    text: "I cannot recommend any scheme that promises fixed or guaranteed doubling returns. Returns on investments are never certain. Under RBI and SEBI regulations, legitimate financial products do not guarantee doubling within short periods. Consider speaking with your official bank branch or local Bank Sakhi before deciding.",
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    sources: ["SEBI Investor Awareness", "RBI Financial Literacy Guide"],
    flagged: true,
  },
];

export function DemoPage() {
  const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);
  const [status, setStatus] = useState<AiStatusState>("IDLE");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("en");
  const [sessionId] = useState(() => `demo-session-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status]);

  const handleSendMessage = async (text: string, lang: LanguageCode) => {
    const userMsg: ChatMessageData = {
      id: `usr-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setStatus("ANALYZING");

    try {
      setTimeout(() => {
        setStatus("THINKING");
      }, 500);

      const res = await postAgentQuery({
        session_id: sessionId,
        text,
        language: lang,
      });

      setStatus(res.flagged ? "FLAGGED" : "RESPONDING");

      const agentMsg: ChatMessageData = {
        id: `agent-${Date.now()}`,
        role: "agent",
        text: res.response_text,
        timestamp: new Date().toISOString(),
        sources: res.sources,
        flagged: res.flagged,
      };

      setMessages((prev) => [...prev, agentMsg]);

      setTimeout(() => {
        setStatus("IDLE");
      }, 1400);
    } catch (err) {
      console.error(err);
      setStatus("ERROR");
    }
  };

  return (
    <div className="app-shell relative flex min-h-screen flex-col overflow-x-hidden">
      {/* Dynamic Animated Ambient Background */}
      <img src="/images/saahara/girls-tablet-rural-02.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[15%_center] scale-110 opacity-25 -z-10" />
      <div className="ambient-grain pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute top-10 -left-20 h-96 w-96 rounded-full bg-[var(--color-primary-soft)]/60 blur-[100px] animate-float" />
      <div className="pointer-events-none absolute top-1/2 -right-20 h-[450px] w-[450px] rounded-full bg-amber-100/50 blur-[110px] animate-float-slow" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-[var(--color-accent-soft)]/40 blur-[90px] animate-breathe" />

      <Navbar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="surface-card p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  {/* Mini 3D Intelligence Orb Element */}
                  <div className="relative flex h-11 w-11 items-center justify-center [perspective:600px] shrink-0">
                    <div
                      className="absolute inset-0 rounded-full border border-[var(--color-primary)]/40 animate-spin-slow"
                      style={{ transform: "rotateX(65deg) rotateY(20deg)" }}
                    />
                    <div
                      className="absolute inset-1 rounded-full border border-amber-400/40 animate-spin-reverse"
                      style={{ transform: "rotateX(25deg) rotateY(65deg)" }}
                    />
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-soft">
                      <ChartNoAxesCombined className="h-4 w-4" />
                    </div>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--color-foreground)]">
                    AI Chat Demo Console
                  </h1>
                  <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-0.5 text-xs font-bold text-[var(--color-primary)]">
                    Live Demo
                  </span>
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                  Ask Sahaara financial questions in Hindi, Telugu, or English. All guidance is grounded in official financial education materials, with safety guardrails to block harmful schemes.
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex shrink-0 items-center gap-2">
                <ChatStatusBadge
                  status={status}
                  onRetry={() => {
                    const lastMsg = messages[messages.length - 1];
                    if (lastMsg && lastMsg.role === "user") {
                      handleSendMessage(lastMsg.text, selectedLanguage);
                    }
                  }}
                />
              </div>
            </div>

            {/* Feature Highlights Bar */}
            <div className="mt-4 flex flex-wrap items-center gap-4 sm:gap-6 border-t border-[var(--color-border)] pt-3.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
                <span>Official Guidance Sources</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Safety Guardrails Active</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <span>Multilingual: हिन्दी, తెలుగు, English</span>
              </div>
            </div>
          </motion.div>

          {/* Main Chat Card */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="surface-card flex flex-col overflow-hidden border-2 transition-all duration-200 hover:surface-card-hover"
          >
            {/* Messages Thread */}
            <div className="min-h-[440px] max-h-[580px] overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-[var(--color-background)]/60 to-[var(--color-background)]/20">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {/* Typing indicator state */}
              {status === "THINKING" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white shadow-xs">
                    <ChartNoAxesCombined className="h-5 w-5" />
                  </div>
                  <div className="rounded-lg rounded-tl-none border border-[var(--color-border)] bg-white px-4 py-3 shadow-soft">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-bounce" />
                      <span className="ml-2 text-xs font-semibold text-[var(--color-muted-foreground)]">
                        Sahaara AI is preparing guidance...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Console */}
            <ChatInput
              onSend={handleSendMessage}
              disabled={status === "ANALYZING" || status === "THINKING"}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />
          </motion.div>

          {/* Educational Disclaimer */}
          <div className="surface-card flex items-start gap-2.5 p-4 text-xs text-[var(--color-muted-foreground)]">
            <Info className="h-4 w-4 shrink-0 text-[var(--color-primary)] mt-0.5" />
            <p className="leading-relaxed">
              <strong>Educational Guidance Notice:</strong> All responses are educational and based on public financial literacy frameworks. Sahaara does not guarantee financial returns, provide investment promises, or access personal bank accounts.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
