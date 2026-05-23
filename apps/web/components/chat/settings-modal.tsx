"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trash2,
  Download,
  Upload,
  KeyRound,
  Sparkles,
  Database,
  Plus,
  Sun,
  Moon,
  Palette,
} from "lucide-react";
import { useState, useRef } from "react";
import { useSettingsStore } from "@/stores/use-settings-store";
import type { SearchProvider } from "@/types/search";
import { useLunaStore } from "@/stores/use-luna-store";
import { ModelProviderSettings } from "@/components/chat/model-provider-settings";
import { maskApiKey } from "@/lib/api-keys";
import {
  exportNebulaBackup,
  exportMemoriesOnly,
  importNebulaBackup,
  importMemoriesOnly,
} from "@/lib/backup";
import type { LunaControls } from "@/lib/luna-prompt";
import type { ThemeMode } from "@/stores/use-settings-store";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AccountSection } from "@/components/auth/account-section";
import { flushCloudSync } from "@/lib/cloud-sync";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RESPONSE_OPTIONS = [
  { value: "concise", label: "Concise" },
  { value: "balanced", label: "Balanced" },
  { value: "detailed", label: "Detailed" },
];

function Section({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 last:mb-0", className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-hover">
          <Icon size={14} className="text-text-secondary" />
        </div>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  children,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", disabled && "opacity-40")}>
      <span className="text-sm text-text-secondary">{label}</span>
      {children}
    </div>
  );
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const tavilyKey = useSettingsStore((s) => s.tavilyKey);
  const searchProvider = useSettingsStore((s) => s.searchProvider);
  const setTavilyKey = useSettingsStore((s) => s.setTavilyKey);
  const setSearchProvider = useSettingsStore((s) => s.setSearchProvider);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const lunaControls = useSettingsStore((s) => s.lunaControls);
  const setLunaControls = useSettingsStore((s) => s.setLunaControls);
  const memories = useLunaStore((s) => s.memories);
  const removeMemory = useLunaStore((s) => s.removeMemory);
  const addMemories = useLunaStore((s) => s.addMemories);

  const [tvInput, setTvInput] = useState("");
  const [includeKeys, setIncludeKeys] = useState(false);
  const [status, setStatus] = useState("");
  const [newMemory, setNewMemory] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const memRef = useRef<HTMLInputElement>(null);

  const saveTavilyKey = () => {
    if (tvInput.trim()) setTavilyKey(tvInput.trim());
    setTvInput("");
    setStatus("Tavily key saved locally.");
    setTimeout(() => setStatus(""), 3000);
  };

  const handleImport = async (file: File) => {
    try {
      const { summary } = await importNebulaBackup(file);
      await flushCloudSync();
      setStatus(summary);
    } catch (e) {
      setStatus(`Import failed: ${(e as Error).message}`);
    }
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
                className="fixed inset-0 nebula-overlay backdrop-blur-md z-50"
                onClick={() => onOpenChange(false)}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
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
                  "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl sm:pb-0",
                )}
              >
                <div className="shrink-0 flex items-center justify-between gap-3 p-5 pb-4 sm:p-6 border-b border-border">
                  <Dialog.Title className="text-lg sm:text-xl font-semibold tracking-tight text-text-primary">
                    Settings
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    API keys, appearance, Luna preferences, account sync, and data backup.
                  </Dialog.Description>
                  <Dialog.Close
                    type="button"
                    aria-label="Close settings"
                    className="flex items-center justify-center w-9 h-9 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    <X size={18} aria-hidden />
                  </Dialog.Close>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 sm:pt-5">

                <Section icon={KeyRound} title="AI model">
                  <ModelProviderSettings />
                </Section>

                <div className="h-px bg-border mb-8" />

                <Section icon={KeyRound} title="Web search (Tavily)">
                  <p className="text-xs text-text-muted">
                    Only needed when Luna&apos;s search provider is set to Tavily
                    below.
                  </p>

                  {tavilyKey && (
                    <p className="text-xs text-text-muted">
                      Saved: {maskApiKey(tavilyKey)}
                    </p>
                  )}
                  <Input
                    type="password"
                    label="Tavily API key"
                    helper="From tavily.com — used for enhanced web search, not chat."
                    placeholder="tvly-…"
                    value={tvInput}
                    onChange={(e) => setTvInput(e.target.value)}
                    autoComplete="off"
                  />

                  <button
                    type="button"
                    onClick={saveTavilyKey}
                    disabled={!tvInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-accent text-accent-fg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    Save Tavily key
                  </button>
                </Section>

                <div className="h-px bg-border mb-8" />

                <Section icon={Palette} title="Appearance">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">
                      Theme
                    </label>
                    <div
                      role="radiogroup"
                      aria-label="Theme"
                      className="flex gap-1 p-1 rounded-xl bg-bg border border-border"
                    >
                      {(
                        [
                          { value: "dark", label: "Dark", icon: Moon },
                          { value: "light", label: "Light", icon: Sun },
                        ] as const
                      ).map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={theme === value}
                          onClick={() => setTheme(value as ThemeMode)}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            theme === value
                              ? "bg-surface-elevated text-text-primary shadow-sm"
                              : "text-text-muted hover:text-text-secondary",
                          )}
                        >
                          <Icon size={16} aria-hidden />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </Section>

                <div className="h-px bg-border mb-8" />

                <Section icon={Sparkles} title="Luna">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">
                      Web search provider
                    </label>
                    <div
                      role="radiogroup"
                      aria-label="Web search provider"
                      className="flex gap-1 p-1 rounded-xl bg-bg border border-border"
                    >
                      {(
                        [
                          { value: "builtin", label: "Built-in" },
                          { value: "tavily", label: "Tavily" },
                        ] as const
                      ).map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={searchProvider === value}
                          onClick={() =>
                            setSearchProvider(value as SearchProvider)
                          }
                          className={cn(
                            "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            searchProvider === value
                              ? "bg-surface-elevated text-text-primary shadow-sm"
                              : "text-text-muted hover:text-text-secondary",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-text-muted">
                      {searchProvider === "builtin"
                        ? "Luna searches automatically when needed (Google News + web, no key)."
                        : "Luna searches automatically when needed — Tavily key required above."}
                    </p>
                  </div>
                  {searchProvider === "tavily" && !tavilyKey && (
                    <p className="text-xs text-warning">
                      Add a Tavily API key or switch to Built-in search.
                    </p>
                  )}

                  <div>
                    <label className="block text-sm text-text-secondary mb-2">
                      Response style
                    </label>
                    <Select
                      ariaLabel="Response style"
                      value={lunaControls.responseStyle}
                      options={RESPONSE_OPTIONS}
                      onChange={(v) =>
                        setLunaControls({
                          responseStyle: v as LunaControls["responseStyle"],
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2">
                      Memories ({memories.length})
                    </label>

                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        aria-label="Add a memory"
                        placeholder="Add a memory…"
                        value={newMemory}
                        onChange={(e) => setNewMemory(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newMemory.trim()) {
                            addMemories([newMemory.trim()]);
                            setNewMemory("");
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-bg border border-border text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-text-muted transition-colors"
                      />
                      <button
                        type="button"
                        disabled={!newMemory.trim()}
                        aria-label="Add memory"
                        onClick={() => {
                          if (newMemory.trim()) {
                            addMemories([newMemory.trim()]);
                            setNewMemory("");
                          }
                        }}
                        className="shrink-0 p-2 rounded-xl bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-40"
                      >
                        <Plus size={16} aria-hidden />
                      </button>
                    </div>

                    {memories.length > 0 ? (
                      <ul className="space-y-1 max-h-36 overflow-y-auto rounded-xl bg-bg p-2">
                        {memories.map((m) => (
                          <li
                            key={m.id}
                            className="flex items-center justify-between gap-2 text-xs text-text-secondary py-1.5 px-2 rounded-lg hover:bg-surface-hover transition-colors"
                          >
                            <span className="truncate">{m.text}</span>
                            <button
                              type="button"
                              aria-label={`Remove memory: ${m.text}`}
                              onClick={() => removeMemory(m.id)}
                              className="shrink-0 p-1 rounded-md text-text-muted hover:text-danger hover:bg-danger-subtle transition-colors"
                            >
                              <Trash2 size={12} aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-text-muted py-2">
                        No memories yet. Chat with Luna or add them manually above.
                      </p>
                    )}
                  </div>
                </Section>

                <div className="h-px bg-border mb-8" />

                <AccountSection />

                <div className="h-px bg-border mb-8" />

                <Section icon={Database} title="Data">
                  <SettingRow label="Include API keys in backup">
                    <Checkbox
                      checked={includeKeys}
                      onChange={setIncludeKeys}
                      ariaLabel="Include API keys in backup"
                    />
                  </SettingRow>

                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      icon={Download}
                      label="Export backup"
                      onClick={() => exportNebulaBackup(includeKeys)}
                    />
                    <ActionButton
                      icon={Upload}
                      label="Import backup"
                      onClick={() => fileRef.current?.click()}
                    />
                    <ActionButton
                      label="Export memories"
                      onClick={() => exportMemoriesOnly()}
                    />
                    <ActionButton
                      label="Import memories"
                      onClick={() => memRef.current?.click()}
                    />
                  </div>
                </Section>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && confirm("Replace all local data with this backup?")) {
                      void handleImport(f);
                    }
                    e.target.value = "";
                  }}
                />
                <input
                  ref={memRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      void importMemoriesOnly(f)
                        .then(async () => {
                          await flushCloudSync();
                          setStatus("Memories imported.");
                        })
                        .catch((err) => setStatus(String(err)));
                    }
                    e.target.value = "";
                  }}
                />

                <AnimatePresence>
                  {status && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 text-xs text-text-secondary bg-bg rounded-xl px-4 py-3 border border-border"
                    >
                      {status}
                    </motion.p>
                  )}
                </AnimatePresence>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon?: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
    >
      {Icon && <Icon size={14} />}
      {label}
    </button>
  );
}
