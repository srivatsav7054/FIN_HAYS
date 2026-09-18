import { useEffect, useState } from "react";
import { getSessionHistory } from "@/api/sessions";
import { mockTurnSources } from "@/mocks/data";
import { type SessionHistory } from "@/types";
import { X, ShieldAlert, BookOpen, Clock, User, Sprout, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

interface SessionTranscriptDrawerProps {
  sessionId: string | null;
  onClose: () => void;
}

export function SessionTranscriptDrawer({
  sessionId,
  onClose,
}: SessionTranscriptDrawerProps) {
  const { t } = useLanguage();
  const [history, setHistory] = useState<SessionHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setHistory(null);
      return;
    }

    setLoading(true);
    getSessionHistory(sessionId)
      .then((data) => setHistory(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleCopyTranscript = async () => {
    if (!history) return;
    const text = history.turns
      .map((t) => `[${t.role.toUpperCase()} - ${new Date(t.timestamp).toLocaleTimeString()}]: ${t.text}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  if (!sessionId) return null;

  return (
    <motion.div
      key={sessionId}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="surface-card space-y-4 p-5 sm:p-6 rounded-3xl"
      style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 20px -4px rgba(50, 40, 30, 0.08)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-extrabold text-[var(--color-foreground)]">
              {t.transcriptInspector}
            </h3>
            <span className="font-mono rounded-full bg-[var(--color-secondary)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-foreground)]">
              {sessionId}
            </span>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {t.transcriptHint}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyTranscript}
            className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1 text-xs font-bold text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
            title={t.copy}
          >
            <span>{copied ? t.copied : t.copy}</span>
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
            aria-label={t.closeTranscript}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
            <span className="text-xs font-semibold text-[var(--color-muted-foreground)]">
              {t.loadingHistory}
            </span>
          </div>
        </div>
      ) : !history || history.turns.length === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
          {t.noTurns}
        </div>
      ) : (
        <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
          {history.turns.map((turn, idx) => {
            const isUser = turn.role === "user";
            const sources = mockTurnSources(turn.flagged);

            const timeStr = new Date(turn.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            return (
              <div
                key={idx}
                className={`rounded-2xl border p-4 transition-all ${
                  turn.flagged
                    ? "border-amber-400 bg-amber-50/90 shadow-soft"
                    : "border-[var(--color-border)] bg-[var(--color-background)] shadow-2xs"
                }`}
              >
                {/* Turn Header */}
                <div className="flex items-center justify-between mb-2 text-xs">
                  <div className="flex items-center gap-2">
                    {isUser ? (
                      <span className="flex items-center gap-1.5 font-bold text-[var(--color-foreground)]">
                        <User className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                        <span>{t.ruralCaller}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 font-bold text-[var(--color-primary)]">
                        <Sprout className="h-3.5 w-3.5" />
                        <span>{t.sahaaraVoiceAI}</span>
                      </span>
                    )}

                    {turn.flagged && (
                      <span className="flex items-center gap-1 rounded-md bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        <ShieldAlert className="h-3 w-3" />
                        <span>{t.flaggedTurn}</span>
                      </span>
                    )}
                  </div>

                  <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--color-muted-foreground)]">
                    <Clock className="h-3 w-3" />
                    <span>{timeStr}</span>
                  </span>
                </div>

                {/* Turn Text */}
                <p className="text-sm leading-relaxed text-[var(--color-foreground)]">
                  {turn.text}
                </p>

                {/* Agent Guardrail and Verified Sources */}
                {!isUser && (
                  <div className="mt-3 border-t border-[var(--color-border)]/70 pt-2 text-xs">
                    {turn.flagged ? (
                      <div className="flex items-start gap-1.5 rounded-lg bg-amber-100/70 p-2 text-amber-900 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">
                          <strong>{t.safetyAction}:</strong> {t.safetyActionText}
                        </span>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[var(--color-muted-foreground)]">
                      <span className="flex items-center gap-1 text-[var(--color-primary)]">
                        <BookOpen className="h-3 w-3" />
                        <span>{t.officialReferences}:</span>
                      </span>
                      {sources.map((s, i) => (
                        <span
                          key={i}
                          className="rounded bg-[var(--color-card)] px-2 py-0.5 border border-[var(--color-border)] text-[var(--color-foreground)]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
