import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/hooks/useLanguage";
import { ShieldCheck, Lock, Sprout, Heart } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-card)]/70 py-12 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand Col */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
                <Sprout className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold text-[var(--color-foreground)]">
                Sahaara
              </span>
            </div>
            <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
              {t?.tagline ?? "Financial guidance, made simple."}
            </p>
          </div>

          {/* Privacy & Guardrails Callout */}
          <div className="surface-card p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
              <ShieldCheck className="h-5 w-5" />
              <span>Strict Privacy Architecture</span>
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted-foreground)] leading-relaxed">
              Zero bank account linking. All financial amounts are self-reported. Phone numbers are permanently hidden in all interfaces. Responses follow official NCFE/RBI financial literacy materials.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-foreground)]">
              <Lock className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              <span>Masked Identity Protection Enabled</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-[var(--color-foreground)]">Platform Navigation</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]">
                  {t?.navHome ?? "Home"}
                </Link>
              </li>
              <li>
                <Link to="/demo" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]">
                  {t?.navDemo ?? "AI Demo"} (Chat Console)
                </Link>
              </li>
              <li>
                <Link to="/users/u-101" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]">
                  {t?.navProfile ?? "My Profile"}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]">
                  {t?.navDashboard ?? "Dashboard"} (Admin Operations)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--color-border)] pt-6 text-center text-xs text-[var(--color-muted-foreground)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Sahaara • AI-Powered Financial Empowerment for Rural Women.</p>
          <p className="flex items-center gap-1">
            <span>Built with care for rural empowerment</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
