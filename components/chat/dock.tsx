"use client";

import { motion } from "framer-motion";
import { Plus, PanelLeft, Orbit, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface DockProps {
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onOpenOrbit: () => void;
  onOpenSettings: () => void;
  newChatDisabled?: boolean;
}

const DOCK_ITEMS = [
  { key: "new-chat", icon: Plus, label: "New chat" },
  { key: "sidebar", icon: PanelLeft, label: "Chats" },
  { key: "orbit", icon: Orbit, label: "Orbit" },
  { key: "settings", icon: Settings, label: "Settings" },
] as const;

export function Dock({
  onNewChat,
  onToggleSidebar,
  onOpenOrbit,
  onOpenSettings,
  newChatDisabled = false,
}: DockProps) {
  const handleClick = (key: string) => {
    if (key === "new-chat") {
      if (!newChatDisabled) onNewChat();
      return;
    }
    else if (key === "sidebar") onToggleSidebar();
    else if (key === "orbit") onOpenOrbit();
    else if (key === "settings") onOpenSettings();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="nebula-dock-offset nebula-chat-inset-x fixed left-1/2 z-40 w-full max-w-[min(100%,28rem)] -translate-x-1/2 px-1 sm:max-w-none sm:px-0"
    >
      <div className="nebula-panel mx-auto flex w-full max-w-fit items-center justify-center gap-0.5 rounded-2xl px-1.5 py-1.5 nebula-shadow-elevated sm:gap-1 sm:px-2 sm:py-2">
        {DOCK_ITEMS.map((item) => {
          const disabled = item.key === "new-chat" && newChatDisabled;
          return (
          <motion.button
            key={item.key}
            type="button"
            onClick={() => handleClick(item.key)}
            disabled={disabled}
            whileHover={disabled ? undefined : { scale: 1.05 }}
            whileTap={disabled ? undefined : { scale: 0.95 }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-text-secondary transition-colors sm:flex-none sm:px-4",
              disabled
                ? "opacity-35 cursor-default pointer-events-none"
                : "hover:bg-surface-hover hover:text-text-primary",
            )}
          >
            <item.icon size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium hidden sm:inline">{item.label}</span>
          </motion.button>
        );
        })}
      </div>
    </motion.div>
  );
}
