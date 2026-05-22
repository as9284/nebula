"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useNotificationStore } from "@/stores/use-notification-store";
import { useLunaStore } from "@/stores/use-luna-store";
import { cn } from "@/lib/utils";

const AUTO_DISMISS_MS = 6000;

function ToastItem({
  id,
  title,
  body,
  conversationId,
  onDismiss,
}: {
  id: string;
  title: string;
  body: string;
  conversationId?: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [id, onDismiss]);

  const handleOpen = () => {
    if (conversationId) {
      useLunaStore.getState().setActiveConversation(conversationId);
    }
    onDismiss();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ type: "spring", damping: 26, stiffness: 380 }}
      role="status"
      className={cn(
        "nebula-panel pointer-events-auto w-full max-w-[min(100vw-1.5rem,22rem)]",
        "rounded-xl nebula-shadow-modal overflow-hidden",
        conversationId && "cursor-pointer hover:border-luna/30",
      )}
    >
      <div className="flex gap-3 p-3.5">
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            "flex min-w-0 flex-1 gap-3 text-left",
            !conversationId && "cursor-default",
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-luna/15 text-luna">
            <Sparkles size={16} strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1 pt-0.5">
            <span className="block text-sm font-semibold text-text-primary truncate">
              {title}
            </span>
            <span className="mt-0.5 block text-xs text-text-secondary line-clamp-2 leading-relaxed">
              {body}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
}

export function NebulaToasts() {
  const items = useNotificationStore((s) => s.items);
  const dismiss = useNotificationStore((s) => s.dismiss);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed top-0 right-0 z-[100] flex flex-col gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))]"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <ToastItem
            key={item.id}
            id={item.id}
            title={item.title}
            body={item.body}
            conversationId={item.conversationId}
            onDismiss={() => dismiss(item.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
