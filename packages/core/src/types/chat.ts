import type { SearchSource } from "./search";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  sources?: SearchSource[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface Memory {
  id: string;
  text: string;
  createdAt: number;
}
