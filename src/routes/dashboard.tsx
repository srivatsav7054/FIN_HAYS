import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { listSessions } from "@/api/sessions";
import { StatRow } from "@/components/dashboard/StatRow";
import { SessionsTable } from "@/components/dashboard/SessionsTable";
import { SessionTranscriptDrawer } from "@/components/dashboard/SessionTranscriptDrawer";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { type SessionSummary } from "@/types";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

export function DashboardPage() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>("s-2401");
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await listSessions();
      setSessions(data);
      if (!selectedSessionId && data.length > 0) {
        setSelectedSessionId(data[0].session_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="app-shell relative flex min-h-screen flex-col overflow-x-hidden">
      {/* Dynamic Ambient Background Blobs */}
      <img src="/images/saahara/women-phone-yellow-03.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25 -z-10" />
      <div className="ambient-grain pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute top-12 -left-24 h-96 w-96 rounded-full bg-[var(--color-primary-soft)]/50 blur-[100px] animate-float" />
      <div className="pointer-events-none absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-amber-100/40 blur-[100px] animate-float-slow" />

      <Navbar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative z-10">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header Banner */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="surface-card p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-2xs">
                    <LayoutDashboard className="h-6 w-6" />
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--color-foreground)]">
                    {t.dashboardTitle}
                  </h1>
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {t.dashboardSubtitle}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchSessions}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-xs font-bold text-[var(--color-foreground)] shadow-xs transition-all hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)] disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>{t.retry}</span>
                </button>
              </div>
            </div>

          </motion.div>

          {/* Top Stat Row */}
          <StatRow sessions={sessions} />

          {/* Main 2-Column Inspector: Sessions List & Transcript Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <SessionsTable
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                onSelectSession={(id) => setSelectedSessionId(id)}
              />
            </div>

            <div className="lg:col-span-5">
              <SessionTranscriptDrawer
                sessionId={selectedSessionId}
                onClose={() => setSelectedSessionId(null)}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
