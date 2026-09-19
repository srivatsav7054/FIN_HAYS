import { ShieldCheck, Sparkles, RefreshCw, AlertCircle, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export type AiStatusState = "IDLE" | "THINKING" | "ANALYZING" | "RESPONDING" | "FLAGGED" | "ERROR";

interface ChatStatusBadgeProps {
  status: AiStatusState;
  onRetry?: () => void;
}

export function ChatStatusBadge({ status, onRetry }: ChatStatusBadgeProps) {
  const { t } = useLanguage();
  switch (status) {
    case "IDLE":
      return (
        <div className="flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-600" />
          </span>
          <span>{t.statusReady}</span>
        </div>
      );

    case "ANALYZING":
      return (
        <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-600" />
          <span>{t.statusAnalyzing}</span>
        </div>
      );

    case "THINKING":
      return (
        <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs font-semibold text-[var(--color-foreground)]">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-bounce" />
          </div>
          <span>{t.statusFinding}</span>
        </div>
      );

    case "RESPONDING":
      return (
        <div className="flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
          <span>{t.statusDelivering}</span>
        </div>
      );

    case "FLAGGED":
      return (
        <div className="flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
          <span>{t.statusSafetyTriggered}</span>
        </div>
      );

    case "ERROR":
      return (
        <div className="flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">
          <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
          <span>{t.statusConnection}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-1 flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-900 hover:bg-rose-200"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              <span>{t.retry}</span>
            </button>
          )}
        </div>
      );
  }
}
