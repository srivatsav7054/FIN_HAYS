import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, HelpCircle } from "lucide-react";

interface FlaggedCardProps {
  children: ReactNode;
}

export function FlaggedCard({ children }: FlaggedCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0.7 }}
      animate={{
        scale: 1,
        opacity: 1,
        boxShadow: [
          "0 0 0 1px rgba(217, 119, 6, 0.25), 0 4px 12px rgba(217, 119, 6, 0.08)",
          "0 0 0 4px rgba(217, 119, 6, 0.35), 0 8px 24px rgba(217, 119, 6, 0.16)",
          "0 0 0 1px rgba(217, 119, 6, 0.25), 0 4px 12px rgba(217, 119, 6, 0.08)",
        ],
      }}
      transition={{
        scale: { duration: 0.22, ease: "easeOut" },
        opacity: { duration: 0.22, ease: "easeOut" },
        boxShadow: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
      }}
      className="relative rounded-2xl border-2 border-amber-400 bg-amber-50/90 p-4 sm:p-5 shadow-soft"
    >
      {/* Top Banner indicating safety mechanism */}
      <div className="mb-2.5 flex items-center justify-between border-b border-amber-200/80 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <span>Safety Check • Reviewed for your protection</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
          <HelpCircle className="h-3 w-3" />
          <span>Safety Check Active</span>
        </div>
      </div>

      {/* Main response content */}
      <div className="text-amber-950 font-normal">
        {children}
      </div>

      {/* Helpful educational reassurance footnote */}
      <div className="mt-3 rounded-xl bg-amber-100/70 p-3 text-xs text-amber-800 leading-snug">
        💡 <strong>Important Notice:</strong> This question mentions schemes that promise guaranteed high returns in a short time. In India, no safe and legal investment guarantees such returns. Please speak with your local Bank Sakhi or visit your nearest official bank before making any decisions.
      </div>
    </motion.div>
  );
}
