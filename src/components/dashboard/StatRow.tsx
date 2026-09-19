import { useState, useEffect } from "react";
import { type SessionSummary } from "@/types";
import { MessageSquare, ShieldAlert, Globe, Activity, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

interface StatRowProps {
  sessions: SessionSummary[];
}

function AnimatedCounter({ value, duration = 0.8 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.round(easeProgress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

export function StatRow({ sessions }: StatRowProps) {
  const { t } = useLanguage();
  const totalSessions = sessions.length;
  const flaggedCount = sessions.filter((s) => s.flagged).length;
  const flaggedPercent =
    totalSessions > 0 ? Math.round((flaggedCount / totalSessions) * 100) : 0;

  const languages = Array.from(new Set(sessions.map((s) => s.language)));
  const activeCount = sessions.filter((s) => s.status === "active").length;

  const langNames: Record<string, string> = {
    hi: "Hindi",
    te: "Telugu",
    en: "English",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Total Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.04, ease: "easeOut" }}
        whileHover={{ y: -3 }}
        className="surface-card flex min-h-[148px] flex-col justify-between p-6 rounded-3xl hover:surface-card-hover hover:border-[var(--color-primary)]"
        style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 18px -4px rgba(50, 40, 30, 0.08)" }}
      >
        <div className="flex items-center justify-between text-xs font-bold text-[var(--color-muted-foreground)]">
          <span>{t.totalCallSessions}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-2xs">
            <MessageSquare className="h-4 w-4" />
          </div>
        </div>
        <div className="my-1.5 font-mono text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-foreground)]">
          <AnimatedCounter value={totalSessions} />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] font-medium">
          <TrendingUp className="h-3.5 w-3.5 text-[var(--color-primary)]" />
          <span>{t.recordedConversations}</span>
        </div>
      </motion.div>

      {/* Flagged Responses - Deliberate Terracotta/Amber Focus */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.08, ease: "easeOut" }}
        whileHover={{ y: -3 }}
        className="surface-card flex min-h-[148px] flex-col justify-between border-amber-200/90 bg-gradient-to-br from-amber-50/90 to-amber-100/40 p-6 rounded-3xl hover:surface-card-hover hover:border-amber-400"
        style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 4px 18px -4px rgba(217, 119, 6, 0.1)" }}
      >
        <div className="flex items-center justify-between text-xs font-bold text-amber-900">
          <span>{t.safetyFlaggedTurns}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-200 text-amber-900 shadow-2xs">
            <ShieldAlert className="h-4 w-4" />
          </div>
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <span className="font-mono text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-accent)]">
            <AnimatedCounter value={flaggedCount} />
          </span>
          <span className="text-xs font-bold text-amber-800 font-mono">
            ({flaggedPercent}% {t.intercepted})
          </span>
        </div>
        <p className="text-xs text-amber-900/90 leading-tight font-medium">
          {t.unsafeQueriesBlocked}
        </p>
      </motion.div>

      {/* Languages Used */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.12, ease: "easeOut" }}
        whileHover={{ y: -3 }}
        className="surface-card flex min-h-[148px] flex-col justify-between p-6 rounded-3xl hover:surface-card-hover hover:border-[var(--color-primary)]"
        style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 18px -4px rgba(50, 40, 30, 0.08)" }}
      >
        <div className="flex items-center justify-between text-xs font-bold text-[var(--color-muted-foreground)]">
          <span>{t.languagesActive}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--color-secondary)] text-[var(--color-foreground)] shadow-2xs">
            <Globe className="h-4 w-4" />
          </div>
        </div>
        <div className="my-1.5 font-mono text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-foreground)]">
          <AnimatedCounter value={languages.length} />
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] leading-tight font-medium">
          {languages.map((l) => langNames[l] || l).join(", ")}
        </p>
      </motion.div>

      {/* Active Calls */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.16, ease: "easeOut" }}
        whileHover={{ y: -3 }}
        className="surface-card flex min-h-[148px] flex-col justify-between border-teal-200 bg-gradient-to-br from-teal-50/70 to-teal-100/30 p-6 rounded-3xl hover:surface-card-hover hover:border-teal-300"
        style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 18px -4px rgba(74, 122, 88, 0.08)" }}
      >
        <div className="flex items-center justify-between text-xs font-bold text-teal-900">
          <span>{t.liveCallStatus}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-200 text-teal-900 shadow-2xs">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <span className="font-mono text-3xl sm:text-4xl font-black tracking-tight text-teal-950">
            <AnimatedCounter value={activeCount} />
          </span>
          <span className="text-xs font-bold text-teal-800 font-mono">
            {t.activeRightNow}
          </span>
        </div>
        <p className="text-xs text-teal-800 leading-tight font-medium">
          {totalSessions - activeCount} {t.sessionsCompleted}
        </p>
      </motion.div>
    </div>
  );
}
