import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, PiggyBank, Target, Volume2, ChartNoAxesCombined } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

interface FinancialOrbProps {
  className?: string;
}

type ActiveNode = "income" | "expenses" | "savings" | "goals" | null;

const NODE_DETAILS = {
  income: {
    color: "text-teal-700",
    bg: "bg-teal-50 border-teal-300",
  },
  expenses: {
    color: "text-amber-800",
    bg: "bg-amber-50 border-amber-300",
  },
  savings: {
    color: "text-teal-800",
    bg: "bg-teal-100/80 border-teal-400",
  },
  goals: {
    color: "text-[var(--color-accent)]",
    bg: "bg-[var(--color-accent-soft)] border-[var(--color-accent)]",
  },
};

export function FinancialOrb({
  className = "",
}: FinancialOrbProps) {
  const { t } = useLanguage();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeNode, setActiveNode] = useState<ActiveNode>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [audioPulse, setAudioPulse] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  // Periodic gentle audio wave pulse to simulate voice-first nature
  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setInterval(() => {
      setAudioPulse(true);
      setTimeout(() => setAudioPulse(false), 1200);
    }, 4000);
    return () => clearInterval(timer);
  }, [prefersReducedMotion]);

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  if (prefersReducedMotion) {
    return (
      <div className={`surface-card relative flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] mb-3">
          <ChartNoAxesCombined className="h-10 w-10" />
        </div>
        <h3 className="font-display text-xl font-bold text-[var(--color-foreground)]">
          Financial Intelligence Core
        </h3>
        <p className="max-w-xs text-center text-xs text-[var(--color-muted-foreground)] mt-1">
          Personalised financial guidance based on self-reported income, expenses, and savings goals.
        </p>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`surface-card relative flex flex-col items-center justify-center overflow-hidden p-6 ${className}`}
      style={{
        boxShadow: isHovered
          ? "inset 0 1px 0 rgba(255,255,255,0.9), 0 22px 48px -22px rgba(74, 122, 88, 0.38), 0 0 0 1px rgba(74, 122, 88, 0.15)"
          : "inset 0 1px 0 rgba(255,255,255,0.86), 0 16px 34px -24px rgba(74, 122, 88, 0.24)",
      }}
    >
      {/* 3D Ambient Stage Lights */}
      <div
        className="absolute -top-16 -left-16 h-48 w-48 rounded-full pointer-events-none transition-opacity duration-700"
        style={{
          background: "radial-gradient(circle, rgba(74, 122, 88, 0.35) 0%, transparent 70%)",
          opacity: isHovered ? 0.9 : 0.45,
        }}
      />
      <div
        className="absolute -bottom-16 -right-16 h-52 w-52 rounded-full pointer-events-none transition-opacity duration-700"
        style={{
          background: "radial-gradient(circle, rgba(200, 109, 68, 0.25) 0%, transparent 70%)",
          opacity: isHovered ? 0.8 : 0.35,
        }}
      />

      <div className="relative z-30 mb-3 flex w-full items-center justify-center">
        <div className="flex max-w-full items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-card)]/92 px-3 py-1.5 text-center text-[11px] font-bold text-[var(--color-foreground)] shadow-soft backdrop-blur-md">
          <Volume2 className={`h-3.5 w-3.5 shrink-0 text-[var(--color-primary)] ${audioPulse ? "animate-bounce text-[var(--color-accent)]" : ""}`} />
          <span>{t.orbVoiceLabel}</span>
          {audioPulse && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500 animate-ping" />
          )}
        </div>
      </div>

      {/* Main 3D perspective stage: idle-only motion with refined node focus. */}
      <div
        className="relative z-20 flex h-[19rem] w-full max-w-[19rem] items-center justify-center sm:h-84 sm:max-w-84"
        style={{
          perspective: "1200px",
          transformStyle: "preserve-3d",
          transform: `rotateX(${activeNode === "income" ? 3 : activeNode === "goals" ? -3 : 0}deg) rotateY(${activeNode === "expenses" ? -4 : activeNode === "savings" ? 4 : 0}deg) scale(${activeNode ? 1.035 : isHovered ? 1.015 : 1})`,
          transition: "transform 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Dynamic 3D Perspective Floor Shadow that squashes and stretches */}
        <div
          className="absolute -bottom-8 h-10 w-48 rounded-[100%] bg-teal-950/20 blur-md pointer-events-none transition-all duration-700"
          style={{
            transform: `scale(${isHovered ? 1.25 : 1}) translateZ(-60px)`,
            opacity: isHovered ? 0.45 : 0.25,
          }}
        />

        {/* 3D Gimbal Ring 1: Equatorial Orbital Ring with Glowing Dash */}
        <div
          className="absolute inset-1 rounded-full border-2 border-dashed border-[var(--color-primary)]/50 pointer-events-none"
          style={{
            transform: "rotateX(72deg) rotateZ(0deg)",
            animation: "spin-slow 20s linear infinite",
          }}
        />

        {/* 3D Gimbal Ring 2: Polar Orbital Ring with Amber Accent */}
        <div
          className="absolute inset-5 rounded-full border border-[var(--color-accent)]/45 pointer-events-none"
          style={{
            transform: "rotateY(70deg) rotateZ(45deg)",
            animation: "spin-reverse 15s linear infinite",
          }}
        />

        {/* 3D Gimbal Ring 3: Tilted Outer Ring with Pulse */}
        <div
          className="absolute inset-9 rounded-full border border-teal-400/35 pointer-events-none"
          style={{
            transform: "rotateX(45deg) rotateY(45deg)",
            animation: "spin-slow 26s linear infinite",
          }}
        />

        {/* Voice AI Soundwave Ripple Rings */}
        <div
          className={`absolute h-36 w-36 rounded-full border-2 border-[var(--color-primary)]/40 pointer-events-none transition-all duration-1000 ${
            audioPulse ? "scale-150 opacity-0" : "scale-100 opacity-60"
          }`}
        />
        <div
          className={`absolute h-44 w-44 rounded-full border border-[var(--color-accent)]/30 pointer-events-none transition-all duration-1000 delay-150 ${
            audioPulse ? "scale-150 opacity-0" : "scale-100 opacity-40"
          }`}
        />

        {/* 3D Constellation Satellite 1: Rupee Sign */}
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-[11px] font-black text-amber-950 shadow-md">
            ₹
          </div>
        </motion.div>

        {/* 3D Constellation Satellite 2: Harvest Seed Icon */}
        <motion.div
          animate={{
            rotate: [360, 0],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-[11px] font-black text-white shadow-md">
            🌾
          </div>
        </motion.div>

        {/* Central Core: AI Mitra Sphere with 3D Holographic Glow */}
        <motion.div
          whileHover={{ scale: 1.05, rotateZ: 2 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setActiveNode(null)}
          className="relative flex h-34 w-34 cursor-pointer items-center justify-center rounded-full border-2 border-teal-300/80 bg-gradient-to-b from-white via-white/90 to-teal-50/80 backdrop-blur-lg shadow-2xl transition-all duration-200"
          style={{
            boxShadow: isHovered
              ? "0 0 45px rgba(74, 122, 88, 0.55), inset 0 0 25px rgba(74, 122, 88, 0.35)"
              : "0 0 24px rgba(74, 122, 88, 0.25), inset 0 0 12px rgba(74, 122, 88, 0.2)",
          }}
        >
          <div className="flex flex-col items-center text-center p-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-tr from-[var(--color-primary)] to-teal-600 text-white shadow-lift">
              <ChartNoAxesCombined className="h-7 w-7 stroke-[2.2]" />
            </div>
            <span className="mt-1.5 font-display text-[12px] font-black text-[var(--color-foreground)] tracking-tight">
              Sahaara AI
            </span>
            <span className="text-[9px] font-extrabold text-[var(--color-primary)] uppercase tracking-widest">
              {t.orbCoreLabel}
            </span>
          </div>
        </motion.div>

        {/* Orbital Satellite Node 1: Income (Top-Left) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveNode(activeNode === "income" ? null : "income")}
          className={`absolute -top-2 left-2 z-30 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold shadow-lift backdrop-blur-md transition-all ${
            activeNode === "income"
              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white ring-4 ring-teal-100"
              : "border-[var(--color-border)] bg-white/95 text-[var(--color-foreground)] hover:border-[var(--color-primary)] hover:shadow-glow"
          }`}
        >
          <TrendingUp className={`h-3.5 w-3.5 ${activeNode === "income" ? "text-white" : "text-[var(--color-primary)]"}`} />
          <span>{t.orbIncome}</span>
        </motion.button>

        {/* Orbital Satellite Node 2: Expenses (Top-Right) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveNode(activeNode === "expenses" ? null : "expenses")}
          className={`absolute top-2 -right-3 z-30 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold shadow-lift backdrop-blur-md transition-all ${
            activeNode === "expenses"
              ? "border-amber-500 bg-amber-600 text-white ring-4 ring-amber-100"
              : "border-[var(--color-border)] bg-white/95 text-[var(--color-foreground)] hover:border-amber-400 hover:shadow-amber-glow"
          }`}
        >
          <TrendingDown className={`h-3.5 w-3.5 ${activeNode === "expenses" ? "text-white" : "text-amber-600"}`} />
          <span>{t.orbExpenses}</span>
        </motion.button>

        {/* Orbital Satellite Node 3: Savings (Bottom-Right) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveNode(activeNode === "savings" ? null : "savings")}
          className={`absolute bottom-1 -right-4 z-30 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold shadow-lift backdrop-blur-md transition-all ${
            activeNode === "savings"
              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white ring-4 ring-teal-100"
              : "border-[var(--color-border)] bg-white/95 text-[var(--color-foreground)] hover:border-[var(--color-primary)] hover:shadow-glow"
          }`}
        >
          <PiggyBank className={`h-3.5 w-3.5 ${activeNode === "savings" ? "text-white" : "text-[var(--color-primary)]"}`} />
          <span>{t.orbSavings}</span>
        </motion.button>

        {/* Orbital Satellite Node 4: Goals (Bottom-Left) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveNode(activeNode === "goals" ? null : "goals")}
          className={`absolute -bottom-2 left-4 z-30 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold shadow-lift backdrop-blur-md transition-all ${
            activeNode === "goals"
              ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white ring-4 ring-orange-100"
              : "border-[var(--color-border)] bg-white/95 text-[var(--color-foreground)] hover:border-[var(--color-accent)]"
          }`}
        >
          <Target className={`h-3.5 w-3.5 ${activeNode === "goals" ? "text-white" : "text-[var(--color-accent)]"}`} />
          <span>{t.orbGoals}</span>
        </motion.button>

        {/* 3D Floating Sparks and Particles */}
        <div className="absolute top-8 left-10 h-2.5 w-2.5 rounded-full bg-teal-400 opacity-80 animate-ping pointer-events-none" />
        <div className="absolute bottom-12 right-8 h-3 w-3 rounded-full bg-amber-400 opacity-70 animate-bounce pointer-events-none" />
        <div className="absolute top-14 right-10 h-2 w-2 rounded-full bg-[var(--color-accent)] opacity-85 pointer-events-none" />
        <div className="absolute bottom-6 left-14 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] opacity-75 pointer-events-none" />
      </div>

      <div className="mt-3 min-h-[64px] w-full max-w-xl px-1">
        <AnimatePresence mode="wait">
          {activeNode ? (
            <motion.div
              key={activeNode}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={`rounded-2xl border p-3.5 text-left shadow-soft ${NODE_DETAILS[activeNode].bg}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-extrabold ${NODE_DETAILS[activeNode].color}`}>
                  {t.orbDetails[activeNode].title}
                </span>
                <span className="rounded-full bg-white/80 px-2 py-0.5 font-mono text-[11px] font-extrabold text-[var(--color-foreground)] shadow-2xs">
                  {t.orbDetails[activeNode].badge}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-foreground)] leading-snug">
                {t.orbDetails[activeNode].description}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
