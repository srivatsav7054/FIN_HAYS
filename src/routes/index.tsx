import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FinancialOrb } from "@/components/spline/FinancialOrb";
import {
  MessageSquare,
  LayoutDashboard,
  PhoneCall,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const heroItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export function LandingPage() {
  const { t } = useLanguage();
  return (
    <div className="app-shell relative flex min-h-screen flex-col overflow-x-hidden">
      {/* Dynamic Animated Ambient Mesh Background Blobs */}
      <div className="ambient-grain pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[var(--color-primary-soft)]/60 blur-[100px] animate-float-slow" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-amber-100/50 blur-[110px] animate-float" />
      <div className="pointer-events-none absolute bottom-1/4 left-1/4 h-[420px] w-[420px] rounded-full bg-[var(--color-accent-soft)]/50 blur-[100px] animate-breathe" />

      <Navbar />

      <main className="flex-1 relative z-10 flex flex-col justify-center">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pt-16 sm:pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Mission, Headline, Explainer & CTAs */}
              <motion.div
                initial="hidden"
                animate="show"
                transition={{ staggerChildren: 0.055 }}
                className="lg:col-span-7 space-y-6 sm:space-y-8"
              >
                {/* Mission Pill with Animated Pulse */}
                <motion.div
                  variants={heroItem}
                  whileHover={{ scale: 1.03, y: -1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  className="inline-flex items-center gap-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/90 px-4 py-2 text-xs sm:text-sm font-bold text-[var(--color-primary)] shadow-soft backdrop-blur-md"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-primary)]" />
                  </span>
                  <span>{t.landingMission}</span>
                </motion.div>

                {/* Main Headline */}
                <motion.h1 variants={heroItem} className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--color-foreground)] leading-[1.05]">
                  {t.landingHeadline}
                </motion.h1>

                {/* Explainer */}
                <motion.p variants={heroItem} className="text-lg sm:text-xl text-[var(--color-muted-foreground)] leading-relaxed max-w-2xl font-medium">
                  {t.heroBody}
                </motion.p>

                {/* CTAs with Spring Micro-interactions and Soft Shadow Bloom */}
                <motion.div variants={heroItem} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Link
                      to="/login"
                      className="btn-shimmer flex min-h-[56px] items-center justify-center gap-3 rounded-lg bg-[var(--color-primary)] px-8 py-3.5 text-base font-bold text-white shadow-lift transition-all hover:shadow-glow hover:bg-emerald-800"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span>{t.enterSahaara}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Link
                      to="/login"
                      className="flex min-h-[56px] items-center justify-center gap-2.5 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-card)] px-7 py-3.5 text-base font-bold text-[var(--color-foreground)] shadow-soft transition-all hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]"
                      style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.85)" }}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      <span>{t.chooseWorkspace}</span>
                    </Link>
                  </motion.div>
                </motion.div>

                {/* Trust Signals */}
                <motion.div variants={heroItem} className="pt-4 flex flex-wrap items-center gap-6 text-xs sm:text-sm font-semibold text-[var(--color-muted-foreground)]">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    className="flex items-center gap-2"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-[var(--color-accent)] shadow-2xs">
                      <PhoneCall className="h-4 w-4" />
                    </span>
                    <span>{t.voiceAccessible}</span>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    className="flex items-center gap-2"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-[var(--color-primary)] shadow-2xs">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <span>{t.privacyNoLinking}</span>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    className="flex items-center gap-2"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 shadow-2xs">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <span>{t.officialGuidance}</span>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Right Column: Layered 3D Spline Financial Intelligence Orb */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.24, delay: 0.22, ease: "easeOut" }}
                className="lg:col-span-5 flex flex-col items-center justify-center"
              >
                <div className="w-full max-w-lg">
                  <FinancialOrb />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 3 Key Trust Pillars Section */}
        <section className="border-t border-[var(--color-border)] bg-[var(--color-card)]/50 py-20 px-4 sm:px-6 lg:px-8 relative backdrop-blur-xs">
          <div className="mx-auto max-w-7xl">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--color-foreground)]"
              >
                {t.trustTitle}
              </motion.h2>
              <p className="text-base text-[var(--color-muted-foreground)] leading-relaxed">
                {t.trustSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pillar 1 */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="surface-card p-8 space-y-4 hover:surface-card-hover hover:border-[var(--color-primary)]"
                style={{
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 4px 20px -4px rgba(50, 40, 30, 0.06)",
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-display text-2xl font-bold shadow-xs">
                  1
                </div>
                <h3 className="font-display text-xl font-bold text-[var(--color-foreground)]">
                  {t.pillarVoiceTitle}
                </h3>
                <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                  {t.pillarVoiceBody}
                </p>
                <div className="pt-2 text-xs font-bold text-[var(--color-primary)] flex items-center gap-1">
                  <span>{t.pillarVoiceBadge}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </motion.div>

              {/* Pillar 2 */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                className="surface-card p-8 space-y-4 hover:surface-card-hover hover:border-amber-400"
                style={{
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 20px -4px rgba(217, 119, 6, 0.08)",
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-amber-100 text-amber-900 font-display text-2xl font-bold shadow-xs">
                  2
                </div>
                <h3 className="font-display text-xl font-bold text-[var(--color-foreground)]">
                  {t.pillarSafetyTitle}
                </h3>
                <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                  {t.pillarSafetyBody}
                </p>
                <div className="pt-2 text-xs font-bold text-amber-800 flex items-center gap-1">
                  <span>{t.pillarSafetyBadge}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </motion.div>

              {/* Pillar 3 */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
                className="surface-card p-8 space-y-4 hover:surface-card-hover hover:border-[var(--color-accent)]"
                style={{
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 4px 20px -4px rgba(200, 109, 68, 0.08)",
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-display text-2xl font-bold shadow-xs">
                  3
                </div>
                <h3 className="font-display text-xl font-bold text-[var(--color-foreground)]">
                  {t.pillarPrivacyTitle}
                </h3>
                <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                  {t.pillarPrivacyBody}
                </p>
                <div className="pt-2 text-xs font-bold text-[var(--color-accent)] flex items-center gap-1">
                  <span>{t.pillarPrivacyBadge}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
