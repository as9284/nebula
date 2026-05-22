"use client";

import { motion } from "framer-motion";
import { Plus, PanelLeft, Settings } from "lucide-react";

interface DockProps {
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
}

const DOCK_ITEMS = [
  { key: "new-chat", icon: Plus, label: "New chat" },
  { key: "sidebar", icon: PanelLeft, label: "Chats" },
  { key: "settings", icon: Settings, label: "Settings" },
] as const;

export function Dock({ onNewChat, onToggleSidebar, onOpenSettings }: DockProps) {
  const handleClick = (key: string) => {
    if (key === "new-chat") onNewChat();
    else if (key === "sidebar") onToggleSidebar();
    else if (key === "settings") onOpenSettings();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="nebula-dock-offset nebula-chat-inset-x fixed left-1/2 z-40 w-full max-w-[min(100%,24rem)] -translate-x-1/2 px-1 sm:max-w-none sm:px-0"
    >
      <div className="mx-auto flex w-full max-w-fit items-center justify-center gap-0.5 rounded-2xl border border-border bg-surface-elevated/80 px-1.5 py-1.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:gap-1 sm:px-2 sm:py-2">
        {DOCK_ITEMS.map((item) => (
          <motion.button
            key={item.key}
            type="button"
            onClick={() => handleClick(item.key)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary sm:flex-none sm:px-4"
          >
            <item.icon size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium hidden sm:inline">{item.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
