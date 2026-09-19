import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthSession } from "@/hooks/useAuth";
import { type UiLanguage } from "@/types";
import { ChartNoAxesCombined, MessageSquare, User, LayoutDashboard, Menu, X, PhoneCall, Globe, LogOut, Mic } from "lucide-react";
import { motion } from "framer-motion";

const languages: { code: UiLanguage; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
];

export function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const { session, signOut } = useAuthSession();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/", label: t?.navHome ?? "Home", icon: ChartNoAxesCombined },
    { to: "/demo", label: t?.navDemo ?? "AI Demo", icon: MessageSquare },
    ...(session?.role === "admin"
      ? [{ to: "/dashboard", label: "Operations", icon: LayoutDashboard }]
      : [{ to: "/users/u-101", label: t?.navProfile ?? "My Profile", icon: User }]),
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-card)]/78 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-sm">
            <ChartNoAxesCombined className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                Sahaara
              </span>
            </div>
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
              {t?.tagline ?? "Financial guidance, made simple."}
            </p>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden items-center gap-1.5 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className="relative flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all"
              >
                {active && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 rounded-2xl bg-[var(--color-primary)] shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-2 ${
                  active
                    ? "text-white"
                    : "text-[var(--color-foreground)] hover:text-[var(--color-primary)]"
                }`}>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right Controls: Language Selector & Bank Sakhi Indicator */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Talk to Saahaara Voice Feature */}
          <div className="group relative mr-1">
            <Link to="/demo" className="flex items-center gap-2.5 rounded-2xl border border-[var(--color-primary)]/15 bg-[var(--color-primary)]/5 px-4 py-2.5 text-sm font-bold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)]/10">
              <div className="relative flex items-center justify-center">
                <Mic className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-40" style={{ animationDuration: '3s' }}></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]"></span>
                </span>
              </div>
              <span>Talk to Saahaara</span>
            </Link>
            
            {/* Informational Popover */}
            <div className="absolute left-1/2 top-[calc(100%+0.5rem)] hidden w-[280px] -translate-x-1/2 flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-lift backdrop-blur-xl group-hover:flex">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">
                <span className="text-lg leading-none">✦</span> Your financial Saahaara
              </div>
              <p className="text-sm font-semibold leading-relaxed text-[var(--color-foreground)]">
                Talk to Saahaara over a simple phone call — in your own language.
              </p>
              <div className="mt-4 space-y-2 text-xs font-medium text-[var(--color-muted-foreground)]">
                <p>Ask about:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Savings</li>
                  <li>Loans</li>
                  <li>Government schemes</li>
                  <li>Financial planning</li>
                </ul>
              </div>
              <div className="mt-4 border-t border-[var(--color-border)] pt-3 text-xs italic text-[var(--color-muted-foreground)]">
                No app. No complicated screens.
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/90 p-1.5 shadow-xs backdrop-blur-md"
            style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.85)" }}
          >
            <Globe className="ml-2 h-4 w-4 text-[var(--color-muted-foreground)]" />
            <div className="flex gap-1">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`relative rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                    lang === l.code
                      ? "bg-[var(--color-primary)] text-white shadow-2xs"
                      : "text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]"
                  }`}
                  title={`${l.label} (${l.native})`}
                >
                  {l.native}
                </button>
              ))}
            </div>
          </div>

          {session ? (
            <motion.button
              onClick={signOut}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/90 px-3.5 py-2 text-xs font-bold text-[var(--color-foreground)] shadow-2xs"
              title={`Sign out ${session.name}`}
            >
              <LogOut className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              <span>Sign out</span>
            </motion.button>
          ) : (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 rounded-2xl border border-amber-200/90 bg-amber-50/80 px-3.5 py-2 text-xs font-bold text-amber-900 shadow-2xs"
            style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.9)" }}
          >
            <PhoneCall className="h-3.5 w-3.5 text-amber-700" />
            <span>Bank Sakhi Helpline</span>
          </motion.div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Mobile Voice Feature */}
          <Link to="/demo" className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-primary)]/15 bg-[var(--color-primary)]/5 text-[var(--color-primary)]">
            <span className="absolute right-2.5 top-2.5 flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-40" style={{ animationDuration: '3s' }}></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]"></span>
            </span>
            <Mic className="h-5 w-5" />
          </Link>

          {/* Quick mobile language toggle */}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as UiLanguage)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1 text-xs font-bold text-[var(--color-foreground)]"
            aria-label="Select language"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native}
              </option>
            ))}
          </select>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex min-h-[52px] items-center gap-3 rounded-2xl px-4 text-base font-bold transition-colors ${
                    active
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
