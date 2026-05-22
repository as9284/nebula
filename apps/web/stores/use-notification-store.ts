"use client";

import { create } from "zustand";
import { generateId } from "@/lib/utils";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  conversationId?: string;
  createdAt: number;
}

interface NotificationState {
  items: AppNotification[];
  push: (notification: {
    title: string;
    body: string;
    conversationId?: string;
  }) => string;
  dismiss: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  items: [],
  push: (notification) => {
    const id = generateId();
    set((s) => ({
      items: [
        {
          id,
          title: notification.title,
          body: notification.body,
          conversationId: notification.conversationId,
          createdAt: Date.now(),
        },
        ...s.items,
      ].slice(0, 5),
    }));
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ items: s.items.filter((n) => n.id !== id) })),
}));
