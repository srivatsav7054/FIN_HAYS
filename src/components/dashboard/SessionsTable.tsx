import { useState } from "react";
import { type SessionSummary } from "@/types";
import { ShieldAlert, ShieldCheck, ChevronRight, Clock, MessageCircle, Filter, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

interface SessionsTableProps {
  sessions: SessionSummary[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
}

const langLabels: Record<string, string> = {
  hi: "हिन्दी (Hindi)",
  te: "తెలుగు (Telugu)",
  en: "English",
};

export function SessionsTable({
  sessions,
  selectedSessionId,
  onSelectSession,
}: SessionsTableProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<"all" | "active" | "flagged">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessions.filter((s) => {
    if (filter === "active" && s.status !== "active") return false;
    if (filter === "flagged" && !s.flagged) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = s.session_id.toLowerCase().includes(q);
      const matchLang = (langLabels[s.language] || s.language).toLowerCase().includes(q);
      return matchId || matchLang;
    }
    return true;
  });

  return (
    <div
      className="surface-card space-y-4 p-5 sm:p-6 rounded-3xl"
      style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 20px -4px rgba(50, 40, 30, 0.08)" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
        <div>
          <h3 className="font-display text-lg font-extrabold text-[var(--color-foreground)]">
            {t.sessionsTableTitle}
          </h3>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {t.sessionsTableHint}
          </p>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchSession}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pl-8 pr-3 py-1 text-xs font-semibold text-[var(--color-foreground)] placeholder-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:outline-none w-36 sm:w-44"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-[var(--color-muted-foreground)] ml-1" />
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-2.5 py-1 font-bold transition-colors ${
                filter === "all"
                  ? "bg-[var(--color-primary)] text-white shadow-2xs"
                  : "text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]"
              }`}
            >
              {t.all} ({sessions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("active")}
              className={`rounded-lg px-2.5 py-1 font-bold transition-colors ${
                filter === "active"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]"
              }`}
            >
              {t.active}
            </button>
            <button
              type="button"
              onClick={() => setFilter("flagged")}
              className={`rounded-lg px-2.5 py-1 font-bold transition-colors ${
                filter === "flagged"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]"
              }`}
            >
              {t.flagged}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[620px]">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs font-bold text-[var(--color-muted-foreground)]">
              <th className="py-3 px-3">{t.sessionId}</th>
              <th className="py-3 px-3">{t.languageLabel}</th>
              <th className="py-3 px-3">{t.time}</th>
              <th className="py-3 px-3">{t.turns}</th>
              <th className="py-3 px-3">{t.status}</th>
              <th className="py-3 px-3">{t.safetyActive}</th>
              <th className="py-3 px-3 text-right">{t.inspect}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {filteredSessions.map((s, idx) => {
              const isSelected = s.session_id === selectedSessionId;
              const formattedDate = new Date(s.started_at).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <motion.tr
                  key={s.session_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: idx * 0.025 }}
                  onClick={() => onSelectSession(s.session_id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[var(--color-primary-soft)]/70 font-semibold"
                      : "hover:bg-[var(--color-background)]"
                  }`}
                >
                  <td className="py-3.5 px-3 font-mono text-xs font-bold text-[var(--color-foreground)]">
                    {s.session_id}
                  </td>
                  <td className="py-3.5 px-3 text-xs">
                    {langLabels[s.language] || s.language}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-xs text-[var(--color-muted-foreground)]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formattedDate}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-xs">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3 text-[var(--color-muted-foreground)]" />
                      <span>{s.turn_count} {t.turnsLabel}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        s.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]"
                      }`}
                    >
                      {s.status === "active" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                      <span>{s.status === "active" ? t.activeCall : t.completed}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    {s.flagged ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                        <ShieldAlert className="h-3 w-3 text-amber-600" />
                        <span>{t.flagged}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>{t.clean}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline"
                    >
                      <span>{t.viewTranscript}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
