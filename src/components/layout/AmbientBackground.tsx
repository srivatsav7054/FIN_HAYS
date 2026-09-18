import { motion } from "framer-motion";

export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Slow, subtle GPU-accelerated animated gradient mesh (sage -> cream -> terracotta) */}
      <motion.div
        animate={{
          backgroundPosition: ["0% 0%", "100% 50%", "50% 100%", "0% 0%"],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -inset-[20%] opacity-70"
        style={{
          background:
            "radial-gradient(circle at 20% 25%, rgba(74, 122, 88, 0.16) 0%, transparent 45%), radial-gradient(circle at 80% 20%, rgba(200, 109, 68, 0.12) 0%, transparent 45%), radial-gradient(circle at 50% 80%, rgba(217, 119, 6, 0.11) 0%, transparent 50%), radial-gradient(circle at 85% 85%, rgba(74, 122, 88, 0.13) 0%, transparent 45%)",
          filter: "blur(60px)",
        }}
      />

      {/* Tactile Noise/Mesh Texture so no surface feels flat or empty */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Crisp Geometric Dot Matrix Grid with Radial Fade */}
      <div
        className="absolute inset-0 opacity-[0.38]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(74, 122, 88, 0.22) 1.5px, transparent 1.5px), radial-gradient(rgba(200, 109, 68, 0.15) 1px, transparent 1px)",
          backgroundSize: "28px 28px, 56px 56px",
          backgroundPosition: "0 0, 14px 14px",
          maskImage: "radial-gradient(ellipse at 50% 35%, black 65%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 35%, black 65%, transparent 100%)",
        }}
      />

      <div className="absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_82%)]">
        <span className="space-star space-star-one" />
        <span className="space-star space-star-two" />
        <span className="space-star space-star-three" />
        <span className="space-star space-star-four" />
        <span className="space-star space-star-five" />
        <span className="space-orbit space-orbit-one" />
        <span className="space-orbit space-orbit-two" />
        <span className="space-streak space-streak-one" />
        <span className="space-streak space-streak-two" />
      </div>

      {/* Floating Glowing Energy Sphere 1: Primary Sage Green */}
      <motion.div
        animate={{
          x: [0, 45, -25, 0],
          y: [0, -35, 25, 0],
          scale: [1, 1.12, 0.92, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-24 -left-24 h-[440px] w-[440px] rounded-full bg-[var(--color-primary-soft)]/75 blur-[95px]"
      />

      {/* Floating Glowing Energy Sphere 2: Terracotta Warm Light */}
      <motion.div
        animate={{
          x: [0, -50, 35, 0],
          y: [0, 45, -25, 0],
          scale: [0.95, 1.15, 0.98, 0.95],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/3 -right-28 h-[480px] w-[480px] rounded-full bg-[var(--color-accent-soft)]/65 blur-[105px]"
      />

      {/* Floating Glowing Energy Sphere 3: Golden Amber Glow */}
      <motion.div
        animate={{
          x: [0, 35, -35, 0],
          y: [0, -25, 35, 0],
          scale: [1, 0.88, 1.12, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-10 left-1/4 h-[400px] w-[400px] rounded-full bg-amber-100/60 blur-[100px]"
      />
    </div>
  );
}
