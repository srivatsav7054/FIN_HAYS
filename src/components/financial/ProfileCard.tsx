import { type UserProfile } from "@/types";
import { User, Phone, ShieldCheck, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

interface ProfileCardProps {
  profile: UserProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const { t } = useLanguage();
  const languageNames: Record<string, string> = {
    te: "Telugu (తెలుగు)",
    hi: "Hindi (हिन्दी)",
    en: "English",
  };

  // Masked phone format (strict requirement: never unmask)
  const maskedPhone =
    profile.phone_number.length > 5
      ? `XXXXX${profile.phone_number.slice(-5)}`
      : "XXXXX67890";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="surface-card p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold text-2xl">
            {profile.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
                {profile.name}
              </h2>
              <span className="flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                <span>{t.verified}</span>
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span>{t.shgMember}</span>
              </span>
              <span>•</span>
              <span>{t.languageLabel}: <strong>{languageNames[profile.preferred_language] || profile.preferred_language}</strong></span>
            </div>
          </div>
        </div>

        {/* Privacy protected Phone Card */}
        <div className="flex flex-col sm:items-end gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)]">
            <Phone className="h-3.5 w-3.5" />
            <span>{t.callerPrivacy}</span>
          </div>
          <div className="font-mono text-base font-bold tracking-wider text-[var(--color-foreground)]">
            {maskedPhone}
          </div>
          <span className="text-[10px] text-[var(--color-muted-foreground)]">
            {t.phoneHidden}
          </span>
        </div>
      </div>

      {/* Recognition badge */}
      <div className="mt-5 flex items-center gap-2 rounded-lg bg-amber-50/70 border border-amber-200/70 px-4 py-2 text-xs font-medium text-amber-900">
        <Award className="h-4 w-4 text-amber-600 shrink-0" />
        <span>{t.enrolledProgram}</span>
      </div>
    </motion.div>
  );
}
