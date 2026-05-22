"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "danger" | "default";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

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
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ type: "spring", damping: 28, stiffness: 360 }}
                className={cn(
                  "nebula-modal-panel fixed z-50 w-[min(100%,20rem)]",
                  "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                  "rounded-2xl p-5 sm:p-6",
                  "mx-4 sm:mx-0",
                )}
              >
                <Dialog.Title className="text-lg font-semibold tracking-tight text-text-primary">
                  {title}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {description}
                </Dialog.Description>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className={cn(
                      "w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90",
                      variant === "danger"
                        ? "bg-danger-subtle text-danger border border-danger-subtle"
                        : "bg-accent text-accent-fg",
                    )}
                  >
                    {confirmLabel}
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
