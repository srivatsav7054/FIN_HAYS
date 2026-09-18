import { FormEvent, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, ShieldCheck, Sprout, UserRound, UsersRound } from "lucide-react";
import { useAuthSession, type UserRole } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuthSession();
  const { t } = useLanguage();
  const [role, setRole] = useState<UserRole>("user");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t.nameRequired);
      return;
    }

    signIn({
      name: trimmedName,
      role,
      userId: role === "admin" ? "admin-001" : "u-101",
    });
    if (role === "admin") {
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/users/$id", params: { id: "u-101" } });
    }
  };

  return (
    <div className="app-shell relative flex min-h-screen flex-col overflow-hidden">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-glow">
            <Sprout className="h-6 w-6" />
          </span>
          <span className="font-display text-2xl font-bold text-[var(--color-foreground)]">Sahaara</span>
        </Link>
        <Link to="/" className="text-sm font-bold text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-primary)]">
          {t.loginBack}
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)]/82 shadow-lift backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr]"
        >
          <div className="relative hidden overflow-hidden bg-[var(--color-primary)] p-10 text-white lg:block">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-300/30 blur-3xl animate-float" />
            <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-amber-300/25 blur-3xl animate-float-slow" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">{t.loginEyebrow}</p>
                <h1 className="mt-6 font-display text-5xl font-bold leading-tight">{t.loginHeadline}</h1>
                <p className="mt-5 max-w-sm text-sm leading-7 text-emerald-50/85">
                  {t.loginBody}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-emerald-50">
                <ShieldCheck className="h-5 w-5" />
                {t.pillPrivate}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mb-8">
              <p className="text-sm font-bold text-[var(--color-primary)]">{t.loginWelcome}</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-[var(--color-foreground)]">{t.loginChoose}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">{t.loginPrototype}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-bold text-[var(--color-foreground)]">{t.yourName}</label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t.enterName}
                  className="h-12 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-4 text-sm font-semibold outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                />
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-bold text-[var(--color-foreground)]">{t.workspaceType}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <RoleCard active={role === "user"} icon={UserRound} title={t.normalUser} description={t.normalUserDesc} onClick={() => setRole("user")} />
                  <RoleCard active={role === "admin"} icon={UsersRound} title={t.adminRole} description={t.adminRoleDesc} onClick={() => setRole("admin")} />
                </div>
              </fieldset>

              {error && <p className="text-sm font-semibold text-rose-700" role="alert">{error}</p>}

              <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-emerald-800">
                {t.continueSecurely}
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="flex items-center justify-center gap-2 text-xs font-semibold text-[var(--color-muted-foreground)]"><LockKeyhole className="h-3.5 w-3.5" /> {t.localStorageNote}</p>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function RoleCard({ active, icon: Icon, title, description, onClick }: { active: boolean; icon: typeof UserRound; title: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${active ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-sm" : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)]/50"}`}>
      <span className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]"}`}><Icon className="h-4 w-4" /></span>
      <span><strong className="block text-sm text-[var(--color-foreground)]">{title}</strong><span className="mt-1 block text-xs leading-5 text-[var(--color-muted-foreground)]">{description}</span></span>
    </button>
  );
}
