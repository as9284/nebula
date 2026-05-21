"use client";

import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
}

export function Input({ className, label, helper, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl bg-bg border border-border text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200",
          "focus:border-text-muted hover:border-text-muted/60",
          className,
        )}
        {...props}
      />
      {helper && (
        <p className="mt-1.5 text-xs text-text-muted">{helper}</p>
      )}
    </div>
  );
}
