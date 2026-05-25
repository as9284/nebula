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
      <defs>
        <radialGradient
          id="welcome-nebula-glow"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(256 244) rotate(90) scale(190 170)"
        >
          <stop stopColor="var(--color-logo-glow-inner)" />
          <stop offset="0.55" stopColor="var(--color-luna)" />
          <stop offset="1" stopColor="var(--color-luna)" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="welcome-nebula-cloud"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(248 262) scale(120)"
        >
          <stop stopColor="var(--color-logo-glow-inner)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--color-luna)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="128" fill="var(--color-logo-bg)" />
      <rect
        x="1.5"
        y="1.5"
        width="509"
        height="509"
        rx="126.5"
        stroke="var(--color-logo-ring)"
        strokeWidth="1.5"
      />
      <ellipse
        cx="256"
        cy="256"
        rx="176"
        ry="169"
        stroke="var(--color-logo-ring)"
        strokeWidth="1.25"
      />
      <ellipse
        cx="236"
        cy="272"
        rx="132"
        ry="98"
        fill="url(#welcome-nebula-cloud)"
        opacity="0.88"
      />
      <ellipse
        cx="296"
        cy="232"
        rx="108"
        ry="82"
        fill="var(--color-luna)"
        opacity="0.22"
      />
      <circle cx="256" cy="246" r="76" fill="url(#welcome-nebula-glow)" />
      <circle cx="264" cy="238" r="20" fill="var(--color-logo-core)" />
      <circle cx="264" cy="238" r="9" fill="var(--color-logo-core-bright)" />
      <circle cx="106" cy="146" r="3.5" fill="currentColor" opacity="0.35" />
      <circle cx="404" cy="128" r="2.5" fill="currentColor" opacity="0.25" />
      <circle cx="382" cy="372" r="2.25" fill="var(--color-luna)" opacity="0.45" />
      <path
        d="M150 358l3.8 7.6 7.6 1.1-5.7 4.9 1.5 7.6-6.8-3.6-6.8 3.6 1.5-7.6-5.7-4.9 7.6-1.1z"
        fill="currentColor"
        opacity="0.22"
      />
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
