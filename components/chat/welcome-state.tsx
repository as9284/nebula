"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { generateSuggestions } from "@/lib/suggestions";

const FALLBACK_SUGGESTIONS = [
  "What can you help me with?",
  "Add a quick task",
  "What's the weather like?",
  "Shorten a URL",
];

function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="512" height="512" rx="128" fill="#171714" />
      <circle cx="256" cy="256" r="168" stroke="rgba(232,230,227,0.08)" strokeWidth="1.5" />
      <path
        d="M264 96c79.5 0 144 64.5 144 144s-64.5 144-144 144c-10.2 0-20.1-1.1-29.6-3.1 52.6-14.5 91.6-63.1 91.6-121.9 0-58.8-39-107.4-91.6-121.9C243.9 97.1 253.8 96 264 96z"
        fill="currentColor"
      />
      <circle cx="390" cy="140" r="5" fill="currentColor" opacity="0.35" />
      <circle cx="140" cy="380" r="3" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

export function WelcomeState({ onSuggest }: { onSuggest: (text: string) => void }) {
  const [suggestions, setSuggestions] = useState(FALLBACK_SUGGESTIONS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSuggestions(generateSuggestions());
    setReady(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-lg"
      >
        <div className="flex items-center justify-center mb-5">
          <Logo className="w-14 h-14 text-text-primary" />
        </div>
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-text-primary mb-4">
          Luna
        </h1>
        <p className="text-text-secondary text-base sm:text-lg mb-10 leading-relaxed">
          Your local AI assistant — tasks, weather, links, and more in one chat.
        </p>
        <div className="flex flex-wrap gap-2.5 justify-center">
          {suggestions.map((s, i) => (
            <motion.button
              key={s}
              type="button"
              onClick={() => onSuggest(s)}
              initial={ready ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: ready ? 0.1 + i * 0.05 : 0 }}
              className="px-5 py-2.5 rounded-full bg-surface text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
            >
              {s}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
