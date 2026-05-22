"use client";

import { X } from "lucide-react";
import { getSandboxPayload, clearSandboxPayload } from "@/lib/constellations/sandbox";
import { useState, useEffect } from "react";

export function SandboxPanel() {
  const [payload, setPayload] = useState(getSandboxPayload());

  useEffect(() => {
    const id = setInterval(() => setPayload(getSandboxPayload()), 500);
    return () => clearInterval(id);
  }, []);

  if (!payload) return null;

  const type = String(payload.type ?? "code");
  const content = String(payload.content ?? "");

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full max-w-md border-l border-border bg-surface z-30 flex flex-col nebula-shadow-modal">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-text-primary capitalize">
          {type} sandbox
        </span>
        <button
          type="button"
          aria-label="Close sandbox"
          onClick={() => {
            clearSandboxPayload();
            setPayload(null);
          }}
          className="p-1.5 text-text-muted hover:text-text-primary"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
      <pre className="flex-1 overflow-auto p-4 text-sm font-mono text-text-secondary whitespace-pre-wrap">
        {content || JSON.stringify(payload.data ?? payload, null, 2)}
      </pre>
    </div>
  );
}
