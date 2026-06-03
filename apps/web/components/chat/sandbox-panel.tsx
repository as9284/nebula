"use client";

import { X } from "lucide-react";
import { getSandboxPayload, clearSandboxPayload } from "@/lib/constellations/sandbox";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export function SandboxPanel() {
  const [payload, setPayload] = useState(getSandboxPayload());

  useEffect(() => {
    const id = setInterval(() => setPayload(getSandboxPayload()), 500);
    return () => clearInterval(id);
  }, []);

  const close = useCallback(() => {
    clearSandboxPayload();
    setPayload(null);
  }, []);

  if (!payload) return null;

  const type = String(payload.type ?? "code");
  const content = String(payload.content ?? "");

  return (
    <>
      <button
        type="button"
        aria-label="Close sandbox"
        className="fixed inset-0 z-30 bg-black/50 sm:hidden"
        onClick={close}
      />
      <div
        className={cn(
          "fixed z-40 flex flex-col border-border bg-surface nebula-shadow-modal",
          "inset-x-0 bottom-0 max-h-[min(85dvh,100%)] rounded-t-2xl border-t",
          "pb-[env(safe-area-inset-bottom,0px)]",
          "sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:top-0 sm:w-full sm:max-w-md sm:rounded-none sm:border-l sm:border-t-0 sm:max-h-none sm:pb-0",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:pt-3">
          <span className="text-sm font-medium text-text-primary capitalize truncate">
            {type} sandbox
          </span>
          <button
            type="button"
            aria-label="Close sandbox"
            onClick={close}
            className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-xl text-text-muted hover:bg-surface-hover hover:text-text-primary"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <pre className="flex-1 min-h-0 overflow-auto overscroll-contain p-4 text-sm font-mono text-text-secondary whitespace-pre-wrap break-words [-webkit-overflow-scrolling:touch]">
          {content || JSON.stringify(payload.data ?? payload, null, 2)}
        </pre>
      </div>
    </>
  );
}
