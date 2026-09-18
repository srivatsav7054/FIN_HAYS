import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, ExternalLink } from "lucide-react";

interface SourcesListProps {
  sources: string[];
}

export function SourcesList({ sources }: SourcesListProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 border-t border-[var(--color-border)]/60 pt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] transition-colors hover:underline focus:outline-none"
        aria-expanded={isOpen}
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span>
          {sources.length} {sources.length === 1 ? "source" : "sources"} verified
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2.5">
              <p className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                From Official Financial Education Materials:
              </p>
              <ul className="space-y-1 text-xs">
                {sources.map((src, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 rounded-lg bg-[var(--color-card)] px-2.5 py-1.5 font-medium text-[var(--color-foreground)]"
                  >
                    <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                    <span>Source: {src}</span>
                    <ExternalLink className="ml-auto h-3 w-3 text-[var(--color-muted-foreground)]" />
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
