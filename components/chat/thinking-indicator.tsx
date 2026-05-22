"use client";

import { motion } from "framer-motion";
import { Globe, Sparkles, Pencil } from "lucide-react";

interface ThinkingIndicatorProps {
  phase: "searching" | "thinking" | "streaming";
}

const PHASE_CONFIG = {
  searching: {
    label: "Searching the web",
    icon: Globe,
    dotCount: 3,
  },
  thinking: {
    label: "Thinking",
    icon: Sparkles,
    dotCount: 3,
  },
  streaming: {
    label: "Writing",
    icon: Pencil,
    dotCount: 2,
  },
} as const;

export function ThinkingIndicator({ phase }: ThinkingIndicatorProps) {
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={config.label}
      className="flex items-center gap-2.5 select-none min-h-[1.75rem]"
    >
      <div className="relative flex items-center justify-center w-6 h-6">
        <motion.div
          className="absolute inset-0 rounded-full bg-surface-hover"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <Icon size={13} className="relative text-text-muted" />
      </div>

      <span className="text-sm text-text-muted flex items-center gap-1">
        {config.label}
        <span className="flex gap-0.5">
          {Array.from({ length: config.dotCount }).map((_, i) => (
            <motion.span
              key={i}
              className="inline-block w-1 h-1 rounded-full bg-text-muted"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </span>
      </span>
    </div>
  );
}
