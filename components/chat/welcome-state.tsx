"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { generateSuggestions } from "@/lib/suggestions";

const FALLBACK_SUGGESTIONS = [
  "What can you help me with?",
  "Add a quick task",
  "What's the weather like?",
  "Shorten a URL",
];

const GLASS_PANEL =
  "rounded-2xl bg-surface-elevated/80 backdrop-blur-xl border border-border shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]";

function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="512" height="512" rx="128" fill="#171714" />
      <circle
        cx="256"
        cy="256"
        r="168"
        stroke="rgba(232,230,227,0.08)"
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
  const [suggestions, setSuggestions] = useState(FALLBACK_SUGGESTIONS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSuggestions(generateSuggestions());
    setReady(true);
  }, []);

  return (
    <div className="nebula-chat-inset-x nebula-chat-bottom-pad flex flex-col items-center justify-center flex-1 min-h-0 w-full max-w-full">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full min-w-0 max-w-xl"
      >
        <div className={GLASS_PANEL}>
          <div className="px-6 py-8 sm:px-8 sm:py-9 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mb-4 flex justify-center"
            >
              <div className="rounded-2xl ring-1 ring-border bg-surface/60 p-1">
                <Logo className="h-11 w-11 text-text-primary sm:h-12 sm:w-12" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
              className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl"
            >
              Luna
            </motion.h1>
          </div>

          <div className="border-t border-border px-3 py-3.5 sm:px-4">
            <div className="mb-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">
              <Sparkles size={12} strokeWidth={1.5} />
              Try asking
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {suggestions.map((s, i) => (
                <motion.button
                  key={s}
                  type="button"
                  onClick={() => onSuggest(s)}
                  initial={ready ? { opacity: 0, y: 6 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.28,
                    delay: ready ? 0.16 + i * 0.04 : 0,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="group flex max-w-full items-center gap-1.5 rounded-xl border border-border/60 bg-surface/40 px-3 py-2 text-sm text-text-secondary transition-colors hover:border-border hover:bg-surface-hover hover:text-text-primary sm:px-3.5"
                >
                  <span className="min-w-0 max-w-[min(100%,14rem)] truncate sm:max-w-none">
                    {s}
                  </span>
                  <ArrowUpRight
                    size={14}
                    strokeWidth={1.5}
                    className="shrink-0 opacity-40 transition-opacity group-hover:opacity-60"
                  />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
