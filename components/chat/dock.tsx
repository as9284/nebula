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
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="flex items-center gap-1 rounded-2xl bg-surface-elevated/80 backdrop-blur-xl border border-border px-2 py-2 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
        {DOCK_ITEMS.map((item) => (
          <motion.button
            key={item.key}
            type="button"
            onClick={() => handleClick(item.key)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <item.icon size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium hidden sm:inline">{item.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
