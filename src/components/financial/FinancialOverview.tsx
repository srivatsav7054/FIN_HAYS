import { useState } from "react";
import { type UserProfile } from "@/types";
import { TrendingUp, TrendingDown, Target, Edit3, Check, X, PiggyBank, Calendar, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

interface FinancialOverviewProps {
  profile: UserProfile;
  onUpdate: (updated: UserProfile) => Promise<void>;
}

export function FinancialOverview({ profile, onUpdate }: FinancialOverviewProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [income, setIncome] = useState(profile.monthly_income);
  const [expenses, setExpenses] = useState(profile.monthly_expenses);
  const [goal, setGoal] = useState(profile.savings_goal);
  const [isSaving, setIsSaving] = useState(false);
  const [extraMonthlySave, setExtraMonthlySave] = useState(500);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        ...profile,
        monthly_income: Number(income),
        monthly_expenses: Number(expenses),
        savings_goal: Number(goal),
      });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const surplus = Math.max(0, income - expenses);
  const progressPercent = Math.min(100, Math.round(((surplus * 6) / (goal || 1)) * 100));

  // Months to reach goal based on current surplus + extra savings
  const totalMonthlySavingPace = surplus + extraMonthlySave;
  const monthsToGoal = totalMonthlySavingPace > 0 ? Math.ceil(goal / totalMonthlySavingPace) : 0;

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h3 className="font-display text-xl sm:text-2xl font-black text-[var(--color-foreground)] tracking-tight">
            {t.overviewTitle}
          </h3>
          <p className="text-xs text-[var(--color-muted-foreground)] font-medium">
            {t.overviewSubtitle}
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-xs font-bold text-[var(--color-foreground)] shadow-xs transition-all hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]"
            style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.8)" }}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{t.editNumbers}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIncome(profile.monthly_income);
                setExpenses(profile.monthly_expenses);
                setGoal(profile.savings_goal);
                setIsEditing(false);
              }}
              className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-bold text-[var(--color-foreground)] hover:bg-rose-50 hover:text-rose-700"
            >
              <X className="h-3.5 w-3.5" />
              <span>{t.cancel}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isSaving ? t.savingNumbers : t.saveNumbers}</span>
            </button>
          </div>
        )}
      </div>

      {/* Metric Cards Grid with 3D Elevation & Staggered Entrance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Income Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.05, ease: "easeOut" }}
          whileHover={{ y: -3 }}
          className="surface-card flex min-h-[160px] flex-col justify-between p-6 hover:surface-card-hover hover:border-[var(--color-primary)]"
        >
          <div className="flex items-center justify-between text-xs font-bold text-[var(--color-muted-foreground)]">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-[var(--color-primary)]" />
              <span>{t.monthlyIncome}</span>
            </span>
            <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-[10px] text-[var(--color-primary)] font-bold">
              {t.inflow}
            </span>
          </div>

          <div className="mt-3">
            {isEditing ? (
              <div className="flex items-center rounded-lg border border-[var(--color-primary)] bg-white px-3 py-1.5">
                <span className="text-base font-bold text-[var(--color-primary)] mr-1">₹</span>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full text-xl font-bold font-mono focus:outline-none"
                  aria-label="Monthly income amount"
                />
              </div>
            ) : (
              <div className="font-mono text-3xl sm:text-4xl font-black text-[var(--color-primary)] tracking-tight">
                ₹{profile.monthly_income.toLocaleString("en-IN")}
              </div>
            )}
            <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)] font-medium">
              {t.fromFarming}
            </p>
          </div>
        </motion.div>

        {/* Expenses Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.1, ease: "easeOut" }}
          whileHover={{ y: -3 }}
          className="surface-card flex min-h-[160px] flex-col justify-between border-amber-200/90 bg-amber-50/50 p-6 hover:surface-card-hover hover:border-amber-400"
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
            <span className="flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-amber-600" />
              <span>{t.monthlyExpenses}</span>
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] text-amber-800 font-bold">
              {t.outflow}
            </span>
          </div>

          <div className="mt-3">
            {isEditing ? (
              <div className="flex items-center rounded-lg border border-amber-400 bg-white px-3 py-1.5">
                <span className="text-base font-bold text-amber-600 mr-1">₹</span>
                <input
                  type="number"
                  value={expenses}
                  onChange={(e) => setExpenses(Number(e.target.value))}
                  className="w-full text-xl font-bold font-mono focus:outline-none"
                  aria-label="Monthly expenses amount"
                />
              </div>
            ) : (
              <div className="font-mono text-3xl sm:text-4xl font-black text-amber-950 tracking-tight">
                ₹{profile.monthly_expenses.toLocaleString("en-IN")}
              </div>
            )}
            <p className="mt-1.5 text-xs text-amber-800 font-medium">
              {t.expenseDescription}
            </p>
          </div>
        </motion.div>

        {/* Savings Goal Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.15, ease: "easeOut" }}
          whileHover={{ y: -3 }}
          className="surface-card flex min-h-[160px] flex-col justify-between p-6 hover:surface-card-hover hover:border-[var(--color-accent)]"
        >
          <div className="flex items-center justify-between text-xs font-bold text-[var(--color-muted-foreground)]">
            <span className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-[var(--color-accent)]" />
              <span>{t.savingsGoal}</span>
            </span>
            <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-[10px] text-[var(--color-accent)] font-bold">
              {t.target}
            </span>
          </div>

          <div className="mt-3">
            {isEditing ? (
              <div className="flex items-center rounded-lg border border-[var(--color-accent)] bg-white px-3 py-1.5">
                <span className="text-base font-bold text-[var(--color-accent)] mr-1">₹</span>
                <input
                  type="number"
                  value={goal}
                  onChange={(e) => setGoal(Number(e.target.value))}
                  className="w-full text-xl font-bold font-mono focus:outline-none"
                  aria-label="Savings goal amount"
                />
              </div>
            ) : (
              <div className="font-mono text-3xl sm:text-4xl font-black text-[var(--color-accent)] tracking-tight">
                ₹{profile.savings_goal.toLocaleString("en-IN")}
              </div>
            )}
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--color-muted-foreground)] mb-1">
                <span>{t.estimatedProgress}</span>
                <span className="font-bold text-[var(--color-foreground)]">{progressPercent}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[var(--color-secondary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Monthly Available Surplus Card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.2, ease: "easeOut" }}
        className="surface-card border-emerald-200 bg-gradient-to-r from-emerald-50 via-emerald-50/70 to-emerald-100/40 p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shadow-2xs">
              <PiggyBank className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {t.monthlySurplus}
              </div>
              <div className="font-mono text-2xl font-extrabold text-emerald-950">
                ₹{surplus.toLocaleString("en-IN")} / {t.perMonth}
              </div>
            </div>
          </div>

          <div className="text-xs font-semibold text-emerald-900 bg-white/75 rounded-lg px-3.5 py-2 border border-emerald-200">
            {t.incomeMinus} (₹{income.toLocaleString("en-IN")}) − {t.expensesMinus} (₹{expenses.toLocaleString("en-IN")})
          </div>
        </div>
      </motion.div>
    </div>
  );
}
