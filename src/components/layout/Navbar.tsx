import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useLanguage } from "@/hooks/useLanguage";
import { type UiLanguage } from "@/types";
import { Sprout, MessageSquare, User, LayoutDashboard, Menu, X, PhoneCall, Globe } from "lucide-react";
import { motion } from "framer-motion";

const languages: { code: UiLanguage; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "mr", label: "Marathi", native: "मराठी" },
];

export function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/", label: t?.navHome ?? "Home", icon: Sprout },
    { to: "/demo", label: t?.navDemo ?? "AI Demo", icon: MessageSquare },
    { to: "/users/u-101", label: t?.navProfile ?? "My Profile", icon: User },
    { to: "/dashboard", label: t?.navDashboard ?? "Dashboard", icon: LayoutDashboard },
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
            <Sprout className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                Sahaara
              </span>
              <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-primary)]">
                SH-105
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

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 rounded-2xl border border-amber-200/90 bg-amber-50/80 px-3.5 py-2 text-xs font-bold text-amber-900 shadow-2xs"
            style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.9)" }}
          >
            <PhoneCall className="h-3.5 w-3.5 text-amber-700" />
            <span>Bank Sakhi Helpline</span>
          </motion.div>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
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
