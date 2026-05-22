"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  /** Accessible name when no visible label is associated */
  ariaLabel?: string;
}

export function Checkbox({
  checked,
  onChange,
  disabled,
  id,
  ariaLabel,
}: CheckboxProps) {
  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200 shrink-0",
        checked
          ? "bg-text-primary border-text-primary"
          : "bg-transparent border-border hover:border-text-muted",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      <motion.div
        initial={false}
        animate={{
          scale: checked ? 1 : 0,
          opacity: checked ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        aria-hidden
      >
        <Check size={12} strokeWidth={2.5} className="text-accent-fg" />
      </motion.div>
    </button>
  );
}
