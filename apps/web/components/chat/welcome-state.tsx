"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { generateSuggestions, getWelcomeHeadline } from "@/lib/suggestions";
import { cn } from "@/lib/utils";

function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="512" height="512" rx="128" fill="var(--color-logo-bg)" />
      <circle
        cx="256"
        cy="256"
        r="168"
        stroke="var(--color-logo-ring)"
        strokeWidth="1.5"
      />
      <path
        d="M264 96c79.5 0 144 64.5 144 144s-64.5 144-144 144c-10.2 0-20.1-1.1-29.6-3.1 52.6-14.5 91.6-63.1 91.6-121.9 0-58.8-39-107.4-91.6-121.9C243.9 97.1 253.8 96 264 96z"
        fill="currentColor"
      />
      <circle cx="390" cy="140" r="5" fill="currentColor" opacity="0.35" />
      <circle cx="140" cy="380" r="3" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

export function WelcomeState({
  onSuggest,
}: {
  onSuggest: (text: string) => void;
}) {
  const headline = useMemo(() => getWelcomeHeadline(), []);
  const suggestions = useMemo(() => generateSuggestions(), []);

  return (
    <div className="nebula-chat-inset-x nebula-chat-bottom-pad flex flex-1 min-h-0 w-full max-w-full flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex w-full min-w-0 max-w-2xl flex-col gap-5 sm:gap-6"
      >
        <header className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="nebula-welcome-hero mb-4 sm:mb-5"
          >
            <span className="nebula-welcome-logo nebula-panel flex h-[4.25rem] w-[4.25rem] items-center justify-center sm:h-[4.75rem] sm:w-[4.75rem]">
              <Logo className="h-11 w-11 text-text-primary sm:h-12 sm:w-12" />
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.06 }}
            className="text-sm font-medium text-luna"
          >
            {headline}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="mt-1 text-[2rem] font-semibold tracking-tight text-text-primary sm:text-[2.25rem]"
          >
            Luna
          </motion.h1>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.14, ease: "easeOut" }}
          aria-label="Suggestions"
          className="nebula-panel nebula-shadow-elevated rounded-2xl p-3 sm:p-4"
        >
          <p className="mb-3 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted">
            Try asking
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {suggestions.map((s, i) => (
              <motion.button
                key={s}
                type="button"
                onClick={() => onSuggest(s)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.28,
                  delay: 0.18 + i * 0.04,
                }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className={cn(
                  "nebula-suggestion-pill group flex w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm sm:px-3.5 sm:py-3",
                )}
              >
                <span className="min-w-0 flex-1 leading-snug text-text-primary">
                  {s}
                </span>
                <ArrowUpRight
                  size={14}
                  strokeWidth={1.5}
                  className="shrink-0 text-luna opacity-50 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </motion.button>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
