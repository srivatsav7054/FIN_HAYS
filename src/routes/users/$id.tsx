import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getUserProfile, postUserProfile } from "@/api/users";
import { getTransactions, postTransaction } from "@/api/transactions";
import { ProfileCard } from "@/components/financial/ProfileCard";
import { FinancialOverview } from "@/components/financial/FinancialOverview";
import { FinancialInsightPanel } from "@/components/financial/FinancialInsightPanel";
import { ExpenseChart } from "@/components/financial/ExpenseChart";
import { TransactionList } from "@/components/financial/TransactionList";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { type UserProfile, type Transaction } from "@/types";
import { ShieldCheck, UserCheck, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/users/$id")({
  component: UserProfilePage,
});

export function UserProfilePage() {
  const { id } = Route.useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [p, t] = await Promise.all([
        getUserProfile(userId),
        getTransactions(userId),
      ]);
      setProfile(p);
      setTransactions(t);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(id || "u-101");
  }, [id]);

  const handleUpdateProfile = async (updated: UserProfile) => {
    if (!profile) return;
    const res = await postUserProfile(profile.user_id, updated);
    setProfile(res);
  };

  const handleSaveTransaction = async (tx: Transaction) => {
    if (!profile) return;
    await postTransaction(profile.user_id, tx);
    // Reload transactions
    const updated = await getTransactions(profile.user_id);
    setTransactions(updated);
  };

  return (
    <div className="app-shell relative flex min-h-screen flex-col overflow-x-hidden">
      {/* Dynamic Ambient Background Blobs */}
      <div className="ambient-grain pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute top-10 -left-20 h-80 w-80 rounded-full bg-[var(--color-primary-soft)]/50 blur-[90px] animate-float" />
      <div className="pointer-events-none absolute top-1/2 -right-20 h-96 w-96 rounded-full bg-amber-100/40 blur-[100px] animate-float-slow" />

      <Navbar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative z-10">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Top Switcher for Demo / Judge convenience */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="surface-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-muted-foreground)]">
              <UserCheck className="h-4 w-4 text-[var(--color-primary)]" />
              <span>Current Beneficiary View:</span>
              <strong className="text-[var(--color-foreground)]">
                {profile ? `${profile.name} (${profile.user_id})` : id}
              </strong>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-[var(--color-muted-foreground)]">Switch Demo Profile:</span>
              <Link
                to="/users/$id"
                params={{ id: "u-101" }}
                className={`rounded-xl px-3 py-1 font-bold transition-all ${
                  id === "u-101"
                    ? "bg-[var(--color-primary)] text-white shadow-xs"
                    : "border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]"
                }`}
              >
                Lakshmi Devi (u-101)
              </Link>
              <Link
                to="/users/$id"
                params={{ id: "u-102" }}
                className={`rounded-xl px-3 py-1 font-bold transition-all ${
                  id === "u-102"
                    ? "bg-[var(--color-primary)] text-white shadow-xs"
                    : "border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]"
                }`}
              >
                Sunita Pawar (u-102)
              </Link>
            </div>
          </motion.div>

          {loading ? (
            <div className="surface-card flex h-96 items-center justify-center p-8">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
                <span className="text-sm font-semibold text-[var(--color-muted-foreground)]">
                  Loading self-reported financial profile...
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-rose-900">
              <AlertCircle className="mx-auto h-8 w-8 text-rose-600 mb-2" />
              <p className="font-bold text-base">{error}</p>
              <button
                onClick={() => loadData(id || "u-101")}
                className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
              >
                Try Again
              </button>
            </div>
          ) : profile ? (
            <div className="space-y-10">
              {/* Profile Card */}
              <ProfileCard profile={profile} />

              {/* Editable Financial Overview Numbers */}
              <FinancialOverview
                profile={profile}
                onUpdate={handleUpdateProfile}
              />

              {/* AI Financial Insight Panel */}
              <FinancialInsightPanel profile={profile} />

              {/* Chart & Transactions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5">
                  <ExpenseChart transactions={transactions} />
                </div>
                <div className="lg:col-span-7">
                  <TransactionList
                    transactions={transactions}
                    onSaveTransaction={handleSaveTransaction}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Privacy footer badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-muted-foreground)] pt-4">
            <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
            <span>
              All financial values are self-reported. No automated bank access or statement pulling is performed.
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
