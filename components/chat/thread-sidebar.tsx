"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Settings,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useLunaStore } from "@/stores/use-luna-store";
import { groupConversations } from "@/lib/thread-groups";
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
  const createConversation = useLunaStore((s) => s.createConversation);
  const setActive = useLunaStore((s) => s.setActiveConversation);
  const renameConversation = useLunaStore((s) => s.renameConversation);
  const deleteConversation = useLunaStore((s) => s.deleteConversation);

  const [menuId, setMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const groups = groupConversations(conversations);

  const handleNewChat = () => {
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

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
            aria-hidden
          />

          {/* Sidebar panel */}
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-surface/95 backdrop-blur-xl border-r border-border flex flex-col"
          >
            <div className="p-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleNewChat}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-elevated text-sm text-text-primary hover:bg-surface-hover transition-colors"
              >
                <Plus size={16} />
                New chat
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-3">
              {(Object.entries(groups) as [keyof typeof groups, typeof conversations][]).map(
                ([label, items]) =>
                  items.length > 0 ? (
                    <div key={label} className="mb-4">
                      <p className="px-3 py-1.5 text-[11px] font-medium text-text-muted uppercase tracking-wider">
                        {label}
                      </p>
                      {items.map((c) => (
                        <div key={c.id} className="relative px-1">
                          {renamingId === c.id ? (
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={commitRename}
                              onKeyDown={(e) => e.key === "Enter" && commitRename()}
                              className="w-full px-3 py-2 text-sm rounded-xl bg-surface-elevated border border-border outline-none"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActive(c.id);
                                onClose();
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-xl text-sm truncate pr-8 transition-colors",
                                activeId === c.id
                                  ? "bg-surface-elevated text-text-primary"
                                  : "text-text-secondary hover:bg-surface-hover/60",
                              )}
                            >
                              {c.title}
                            </button>
                          )}
                          {renamingId !== c.id && (
                            <button
                              type="button"
                              onClick={() =>
                                setMenuId(menuId === c.id ? null : c.id)
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                          )}
                          {menuId === c.id && (
                            <div className="absolute right-2 top-full z-10 mt-1 py-1 rounded-xl border border-border bg-surface-elevated shadow-lg min-w-[120px]">
                              <button
                                type="button"
                                onClick={() => startRename(c.id, c.title)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
                              >
                                <Pencil size={14} />
                                Rename
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteConversation(c.id);
                                  setMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400/90 hover:bg-surface-hover transition-colors"
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

            <div className="p-3">
              <button
                type="button"
                onClick={onOpenSettings}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-surface-hover transition-colors"
              >
                <Settings size={16} />
                Settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
