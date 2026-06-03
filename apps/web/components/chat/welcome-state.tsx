"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
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
        className="flex w-full min-w-0 max-w-xl translate-y-4 flex-col sm:max-w-2xl sm:translate-y-6"
      >
        <header className="mb-8 flex flex-col items-center text-center sm:mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="nebula-welcome-hero mb-5 sm:mb-6"
          >
            <span className="nebula-welcome-logo flex h-[4.5rem] w-[4.5rem] items-center justify-center sm:h-[5rem] sm:w-[5rem]">
              <Logo className="h-12 w-12 text-text-primary sm:h-[3.25rem] sm:w-[3.25rem]" />
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
            className="mt-1.5 text-[1.75rem] font-semibold tracking-tight text-text-primary min-[400px]:text-[2.125rem] sm:text-[2.5rem]"
          >
            Luna
          </motion.h1>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.14, ease: "easeOut" }}
          aria-label="Suggestions"
          className="flex w-full flex-col gap-3"
        >
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.16em] text-text-muted">
            Try asking
          </p>

          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:gap-2.5">
            {suggestions.map((s, i) => {
              const ArrowIcon = i % 2 === 0 ? ArrowRight : ArrowUpRight;
              return (
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
                  whileHover={{ scale: 1.012 }}
                  whileTap={{ scale: 0.988 }}
                  className={cn(
                    "nebula-welcome-suggestion group flex w-full min-w-0 items-center gap-2 rounded-2xl px-3 py-3 text-left text-[13px] leading-snug sm:px-3.5 sm:py-3.5 sm:text-sm",
                  )}
                >
                  <span className="min-w-0 flex-1 text-text-primary">
                    {s}
                  </span>
                  <ArrowIcon
                    size={14}
                    strokeWidth={1.5}
                    className="shrink-0 text-text-muted transition-colors group-hover:text-luna"
                    aria-hidden
                  />
                </motion.button>
              );
            })}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
