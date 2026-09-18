import { type UserProfile } from "@/types";
import { Sparkles, HelpCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

interface FinancialInsightPanelProps {
  profile: UserProfile;
}

export function FinancialInsightPanel({ profile }: FinancialInsightPanelProps) {
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
              Personalised Financial Guidance
            </h4>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Guidance based on official NCFE financial education materials
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)] hidden sm:inline">
          Educational Guidance
        </span>
      </div>

      {/* Snapshot Summary Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-[var(--color-muted-foreground)]">Reported Income</span>
          <div className="font-mono text-lg font-extrabold text-[var(--color-foreground)]">
            ₹{profile.monthly_income.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-[var(--color-muted-foreground)]">Reported Expenses</span>
          <div className="font-mono text-lg font-extrabold text-[var(--color-foreground)]">
            ₹{profile.monthly_expenses.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-[var(--color-muted-foreground)]">Target Goal</span>
          <div className="font-mono text-lg font-extrabold text-[var(--color-foreground)]">
            ₹{profile.savings_goal.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* The Core AI Insight with Strict Non-Guaranteed Advisory Language */}
      <div className="rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)]/40 p-5 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
          <CheckCircle2 className="h-4 w-4" />
          <span>Sahaara's Guidance</span>
        </div>

        <p className="text-sm font-medium text-[var(--color-foreground)] leading-relaxed">
          &ldquo;Based on the information provided, your current expense pattern leaves approximately{" "}
          <strong className="text-[var(--color-primary)] font-mono text-base">
            ₹{surplus.toLocaleString("en-IN")}
          </strong>{" "}
          before your savings goal. One possible approach is to set aside ₹2,000 to ₹3,000 per month into a secure, government-backed bank recurring deposit (RD) or Post Office savings account. If this pace is maintained, reaching your ₹{profile.savings_goal.toLocaleString("en-IN")} goal may take approximately {monthsToGoal} months.&rdquo;
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[var(--color-border)]/50 pt-3 text-xs text-[var(--color-muted-foreground)]">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            <span>Consider speaking with your Gram Panchayat Bank Sakhi to verify savings options.</span>
          </div>
          <span className="italic">Based on NCFE Financial Literacy Guide</span>
        </div>
      </div>

      {/* Safety Boundary Callout */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 shadow-2xs">
        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Safety Guardrail Active:</strong> Sahaara never guarantees savings or returns. All insights are educational guidance designed to support informed family budgeting.
        </p>
      </div>
    </motion.div>
  );
}
