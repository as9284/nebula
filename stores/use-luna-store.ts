"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Conversation, Memory, ChatMessage } from "@/types/chat";
import { generateId } from "@/lib/utils";
import { createIdbStorage } from "@/lib/storage";

type StreamPhase = "idle" | "searching" | "thinking" | "streaming";

interface LunaState {
  conversations: Conversation[];
  activeConversationId: string | null;
  memories: Memory[];
  actionResults: Record<string, import("@/lib/constellation-registry").ActionResult[]>;
  isStreaming: boolean;
  streamPhase: StreamPhase;
  draftMessage: string;
  setDraftMessage: (text: string) => void;
  setStreaming: (v: boolean) => void;
  setStreamPhase: (phase: StreamPhase) => void;
  createConversation: () => string;
  setActiveConversation: (id: string | null) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessageContent: (
    conversationId: string,
    messageId: string,
    content: string,
  ) => void;
  truncateFromMessage: (conversationId: string, messageId: string) => void;
  setActionResults: (
    messageId: string,
    results: import("@/lib/constellation-registry").ActionResult[],
  ) => void;
  setMessageSources: (
    conversationId: string,
    messageId: string,
    sources: import("@/types/search").SearchSource[],
  ) => void;
  addMemories: (texts: string[]) => void;
  removeMemory: (id: string) => void;
  setMemories: (memories: Memory[]) => void;
  setConversations: (conversations: Conversation[]) => void;
  getActiveConversation: () => Conversation | undefined;
}

export const useLunaStore = create<LunaState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      memories: [],
      actionResults: {},
      isStreaming: false,
      streamPhase: "idle",
      draftMessage: "",
      setDraftMessage: (draftMessage) => set({ draftMessage }),
      setStreaming: (isStreaming) => set({ isStreaming }),
      setStreamPhase: (streamPhase) => set({ streamPhase }),
      createConversation: () => {
        const id = generateId();
        const conv: Conversation = {
          id,
          title: "New chat",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          conversations: [conv, ...s.conversations],
          activeConversationId: id,
        }));
        return id;
      },
      setActiveConversation: (activeConversationId) =>
        set({ activeConversationId }),
      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c,
          ),
        })),
      deleteConversation: (id) =>
        set((s) => {
          const conversations = s.conversations.filter((c) => c.id !== id);
          const activeConversationId =
            s.activeConversationId === id
              ? conversations[0]?.id ?? null
              : s.activeConversationId;
          return { conversations, activeConversationId };
        }),
      addMessage: (conversationId, message) =>
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const isFirstUser =
              message.role === "user" &&
              c.messages.filter((m) => m.role === "user").length === 0;
            const title = isFirstUser
              ? message.content.slice(0, 40) +
                (message.content.length > 40 ? "…" : "")
              : c.title;
            return {
              ...c,
              title,
              messages: [...c.messages, message],
              updatedAt: Date.now(),
            };
          }),
        })),
      updateMessageContent: (conversationId, messageId, content) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, content } : m,
                  ),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        })),
      truncateFromMessage: (conversationId, messageId) =>
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const idx = c.messages.findIndex((m) => m.id === messageId);
            if (idx === -1) return c;
            return {
              ...c,
              messages: c.messages.slice(0, idx),
              updatedAt: Date.now(),
            };
          }),
        })),
      setActionResults: (messageId, results) =>
        set((s) => ({
          actionResults: { ...s.actionResults, [messageId]: results },
        })),
      setMessageSources: (conversationId, messageId, sources) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, sources } : m,
                  ),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        })),
      addMemories: (texts) =>
        set((s) => {
          const existing = new Set(s.memories.map((m) => m.text));
          const newMemories = texts
            .filter((t) => !existing.has(t))
            .map((text) => ({
              id: generateId(),
              text,
              createdAt: Date.now(),
            }));
          return { memories: [...s.memories, ...newMemories] };
        }),
      removeMemory: (id) =>
        set((s) => ({
          memories: s.memories.filter((m) => m.id !== id),
        })),
      setMemories: (memories) => set({ memories }),
      setConversations: (conversations) => set({ conversations }),
      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId);
      },
    }),
    {
      name: "nebula-luna",
      storage: createJSONStorage(() => createIdbStorage("nebula-luna")),
      partialize: (s) => ({
        conversations: s.conversations,
        activeConversationId: s.activeConversationId,
        memories: s.memories,
      }),
    },
  ),
);
