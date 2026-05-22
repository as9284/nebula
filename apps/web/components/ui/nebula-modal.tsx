"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NebulaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "md" | "lg";
  footer?: React.ReactNode;
}

export function NebulaModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  footer,
}: NebulaModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 nebula-overlay backdrop-blur-sm z-50"
                onClick={() => onOpenChange(false)}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              {...(description ? {} : { "aria-describedby": undefined })}
            >
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className={cn(
                  "nebula-modal-panel fixed z-50 flex flex-col w-full",
                  "inset-x-0 bottom-0 max-h-[min(92dvh,100%)] rounded-t-2xl",
                  "pb-[env(safe-area-inset-bottom,0px)]",
                  "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2",
                  "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[85vh] sm:rounded-2xl",
                  "sm:pb-0",
                  size === "lg" ? "sm:max-w-lg" : "sm:max-w-md",
                )}
              >
                <div className="shrink-0 flex items-start justify-between gap-3 p-5 pb-3 sm:p-6 sm:pb-4 border-b border-border">
                  <div className="min-w-0 flex-1 pr-2">
                    <Dialog.Title className="text-lg sm:text-xl font-semibold tracking-tight text-text-primary">
                      {title}
                    </Dialog.Title>
                    {description ? (
                      <Dialog.Description className="mt-1 text-xs sm:text-sm text-text-muted">
                        {description}
                      </Dialog.Description>
                    ) : null}
                  </div>
                  <Dialog.Close
                    type="button"
                    className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                    aria-label="Close"
                  >
                    <X size={18} aria-hidden />
                  </Dialog.Close>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">
                  {children}
                </div>

                {footer ? (
                  <div className="shrink-0 border-t border-border px-5 py-4 sm:px-6 sm:py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4">
                    {footer}
                  </div>
                ) : null}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
