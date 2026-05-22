"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Settings,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { useLunaStore } from "@/stores/use-luna-store";
import { groupConversations } from "@/lib/thread-groups";
import { isActiveConversationEmpty } from "@/lib/conversation-utils";
import { isConversationStreaming } from "@/lib/luna-stream-selectors";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

interface ThreadSidebarProps {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export function ThreadSidebar({
  open,
  onClose,
  onOpenSettings,
}: ThreadSidebarProps) {
  const conversations = useLunaStore((s) => s.conversations);
  const activeId = useLunaStore((s) => s.activeConversationId);
  const streamingByConversationId = useLunaStore(
    (s) => s.streamingByConversationId,
  );
  const createConversation = useLunaStore((s) => s.createConversation);
  const setActive = useLunaStore((s) => s.setActiveConversation);
  const renameConversation = useLunaStore((s) => s.renameConversation);
  const deleteConversation = useLunaStore((s) => s.deleteConversation);

  const [menuId, setMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const groups = groupConversations(conversations);
  const newChatDisabled = isActiveConversationEmpty({
    conversations,
    activeConversationId: activeId,
  });

  const handleNewChat = () => {
    if (newChatDisabled) return;
    createConversation();
    onClose();
  };

  const startRename = (id: string, title: string) => {
    setRenamingId(id);
    setRenameValue(title);
    setMenuId(null);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      renameConversation(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const requestDelete = (id: string, title: string) => {
    setMenuId(null);
    setDeleteTarget({ id, title });
    onClose();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteConversation(deleteTarget.id);
    setDeleteTarget(null);
    onClose();
  };

  useEffect(() => {
    if (!menuId) return;

    const closeMenu = () => setMenuId(null);

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        menuRef.current?.contains(target) ||
        target.closest("[data-chat-menu-trigger]")
      ) {
        return;
      }
      closeMenu();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuId]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 nebula-overlay z-40"
              onClick={onClose}
              aria-hidden
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 z-50 flex w-[min(100vw,18.5rem)] flex-col border-r border-border bg-surface pt-[env(safe-area-inset-top,0px)] nebula-shadow-elevated"
              aria-label="Chats"
            >
              <div className="shrink-0 p-4 pb-3 flex items-center gap-2 border-b border-border">
                <button
                  type="button"
                  onClick={handleNewChat}
                  disabled={newChatDisabled}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors",
                    newChatDisabled
                      ? "opacity-35 cursor-default text-text-muted"
                      : "bg-surface-elevated text-text-primary hover:bg-surface-hover",
                  )}
                >
                  <Plus size={16} />
                  New chat
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-3 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                  aria-label="Close chats"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-2 px-2">
                {(Object.entries(groups) as [
                  keyof typeof groups,
                  typeof conversations,
                ][]).map(([label, items]) =>
                  items.length > 0 ? (
                    <div key={label} className="mb-4">
                      <p className="px-3 py-2 text-[11px] font-medium text-text-muted uppercase tracking-wider">
                        {label}
                      </p>
                      {items.map((c) => (
                        <div key={c.id} className="relative px-1 mb-0.5">
                          {renamingId === c.id ? (
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={commitRename}
                              onKeyDown={(e) =>
                                e.key === "Enter" && commitRename()
                              }
                              className="w-full px-3 py-3 text-sm rounded-xl bg-bg border border-border text-text-primary outline-none focus:border-text-muted"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setMenuId(null);
                                setActive(c.id);
                                onClose();
                              }}
                              className={cn(
                                "w-full text-left px-3 py-3 rounded-xl text-sm truncate pr-11 transition-colors flex items-center gap-2",
                                activeId === c.id
                                  ? "bg-surface-elevated text-text-primary font-medium"
                                  : "text-text-secondary hover:bg-surface-hover",
                              )}
                            >
                              {isConversationStreaming(
                                { activeConversationId: activeId, streamingByConversationId },
                                c.id,
                              ) ? (
                                <Loader2
                                  size={14}
                                  className="shrink-0 animate-spin text-luna"
                                  aria-hidden
                                />
                              ) : null}
                              <span className="truncate">{c.title}</span>
                            </button>
                          )}
                          {renamingId !== c.id && (
                            <button
                              type="button"
                              data-chat-menu-trigger
                              onClick={() =>
                                setMenuId(menuId === c.id ? null : c.id)
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                              aria-label="Chat options"
                              aria-expanded={menuId === c.id}
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          )}
                          {menuId === c.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-2 top-full z-10 mt-1 py-1 rounded-xl border border-border bg-surface-elevated nebula-shadow-dropdown min-w-[9.5rem]"
                            >
                              <button
                                type="button"
                                onClick={() => startRename(c.id, c.title)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                              >
                                <Pencil size={14} />
                                Rename
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDelete(c.id, c.title)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-danger hover:bg-danger-subtle transition-colors"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null,
                )}
              </div>

              <div className="shrink-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                >
                  <Settings size={16} />
                  Settings
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title="Delete chat?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be removed permanently. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
      />
    </>
  );
}
