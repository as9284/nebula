"use client";

import { motion } from "framer-motion";
import { useLunaStore } from "@/stores/use-luna-store";
import { getConversationStreamPhase } from "@/lib/luna-stream-selectors";
import { cn } from "@/lib/utils";

const PHASE_LABELS = {
  searching: "Stop search",
  describing: "Stop",
  thinking: "Stop thinking",
  streaming: "Stop",
  idle: "Stop",
} as const;

interface StopButtonProps {
  onStop: () => void;
}

export function StopButton({ onStop }: StopButtonProps) {
  const streamPhase = useLunaStore((s) =>
    getConversationStreamPhase(s, s.activeConversationId),
  );
  const label = PHASE_LABELS[streamPhase] ?? "Stop";

  return (
    <motion.button
      type="button"
      onClick={onStop}
      title={label}
      aria-label={label}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "relative shrink-0 flex items-center gap-2 mb-0.5 px-3 py-2 rounded-full",
        "border border-rose-500/35 bg-rose-500/12 text-rose-400",
        "shadow-[0_0_20px_-4px_rgba(244,63,94,0.35)]",
        "hover:bg-rose-500/18 hover:border-rose-500/50 hover:text-rose-300",
        "transition-colors duration-200",
      )}
    >
      <span className="relative flex items-center justify-center w-5 h-5">
        <motion.span
          className="absolute inset-0 rounded-full bg-rose-500/25"
          animate={{ scale: [1, 1.35, 1], opacity: [0.45, 0.15, 0.45] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="absolute inset-0 rounded-full border border-rose-400/40"
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
        <span className="relative block w-2.5 h-2.5 rounded-[3px] bg-current" />
      </span>
      <span className="text-sm font-medium pr-0.5 hidden sm:inline">{label}</span>
    </motion.button>
  );
}
