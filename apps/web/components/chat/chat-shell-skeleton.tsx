"use client";

/** Minimal shell shown until persisted stores rehydrate — keeps SSR and client HTML aligned. */
export function ChatShellSkeleton() {
  return (
    <div className="flex h-full w-full relative bg-bg">
      <div className="flex flex-col flex-1 min-w-0 h-full" />
      <div
        className="fixed bottom-24 left-0 right-0 z-30 px-4 pointer-events-none"
        aria-hidden
      >
        <div className="max-w-2xl mx-auto h-[52px] rounded-2xl border border-border bg-surface-elevated/40" />
      </div>
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        aria-hidden
      >
        <div className="h-10 w-56 rounded-full border border-border bg-surface-elevated/40" />
      </div>
    </div>
  );
}
