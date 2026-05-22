"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { generateSuggestions } from "@/lib/suggestions";
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
  const suggestions = useMemo(
    () => generateSuggestions(),
    [],
  );
  const [ready] = useState(true);

  return (
    <div className="nebula-chat-inset-x nebula-chat-bottom-pad flex flex-col items-center justify-center flex-1 min-h-0 w-full max-w-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full min-w-0 max-w-xl text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-5 flex justify-center"
        >
          <Logo className="h-14 w-14 text-text-primary sm:h-16 sm:w-16" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl"
        >
          Luna
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="mt-8"
        >
          <div className="mb-3 flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary">
            <Sparkles size={12} strokeWidth={1.5} />
            Try asking
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((s, i) => (
              <motion.button
                key={s}
                type="button"
                onClick={() => onSuggest(s)}
                initial={ready ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.28,
                  delay: ready ? 0.14 + i * 0.04 : 0,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "nebula-suggestion-pill group flex max-w-full items-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm text-text-primary transition-colors",
                )}
              >
                <span className="min-w-0 max-w-[min(100%,14rem)] truncate sm:max-w-none">
                  {s}
                </span>
                <ArrowUpRight
                  size={14}
                  strokeWidth={1.5}
                  className="shrink-0 opacity-40 transition-opacity group-hover:opacity-70"
                />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
