import { type UserProfile } from "@/types";
import { Sparkles, HelpCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

interface FinancialInsightPanelProps {
  profile: UserProfile;
}

export function FinancialInsightPanel({ profile }: FinancialInsightPanelProps) {
  const { t } = useLanguage();
  const surplus = profile.monthly_income - profile.monthly_expenses;
  const monthsToGoal =
    surplus > 0 ? Math.ceil(profile.savings_goal / surplus) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: 0.22, ease: "easeOut" }}
      className="surface-card space-y-5 p-6 rounded-3xl"
      style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 20px -4px rgba(50, 40, 30, 0.08)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-display text-lg font-bold text-[var(--color-foreground)]">
              {t.personalisedGuidance}
            </h4>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {t.officialMaterials}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)] hidden sm:inline">
          {t.educationalGuidance}
        </span>
      </div>

      {/* Snapshot Summary Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-[var(--color-muted-foreground)]">{t.reportedIncome}</span>
          <div className="font-mono text-lg font-extrabold text-[var(--color-foreground)]">
            ₹{profile.monthly_income.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-[var(--color-muted-foreground)]">{t.reportedExpenses}</span>
          <div className="font-mono text-lg font-extrabold text-[var(--color-foreground)]">
            ₹{profile.monthly_expenses.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-[var(--color-muted-foreground)]">{t.targetGoal}</span>
          <div className="font-mono text-lg font-extrabold text-[var(--color-foreground)]">
            ₹{profile.savings_goal.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* The Core AI Insight with Strict Non-Guaranteed Advisory Language */}
      <div className="rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)]/40 p-5 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
          <CheckCircle2 className="h-4 w-4" />
          <span>{t.sahaaraGuidance}</span>
        </div>

        <p className="text-sm font-medium text-[var(--color-foreground)] leading-relaxed">
          &ldquo;{surplus > 0 ? t.insightText(`₹${surplus.toLocaleString("en-IN")}`) : t.insightNegative} {t.insightMonths(monthsToGoal)}&rdquo;
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[var(--color-border)]/50 pt-3 text-xs text-[var(--color-muted-foreground)]">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            <span>{t.bankSakhiAdvice}</span>
          </div>
          <span className="italic">{t.basedOnGuide}</span>
        </div>
      </div>

      {/* Safety Boundary Callout */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 shadow-2xs">
        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>{t.safetyGuardrail}:</strong> {t.safetyText}
        </p>
      </div>
    </motion.div>
  );
}
