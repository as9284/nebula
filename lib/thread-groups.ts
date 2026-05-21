import type { Conversation } from "@/types/chat";

export type ThreadGroup = "Today" | "Yesterday" | "Previous 7 days" | "Older";

export function groupConversations(
  conversations: Conversation[],
): Record<ThreadGroup, Conversation[]> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const groups: Record<ThreadGroup, Conversation[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Older: [],
  };

  for (const c of conversations) {
    const d = new Date(c.updatedAt);
    if (d >= startOfToday) groups.Today.push(c);
    else if (d >= startOfYesterday) groups.Yesterday.push(c);
    else if (d >= startOfWeek) groups["Previous 7 days"].push(c);
    else groups.Older.push(c);
  }

  return groups;
}
