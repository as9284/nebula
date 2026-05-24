import type { SearchSource } from "./search";
import type { CodeArtifact } from "../artifact-schema";

export type MessageRole = "user" | "assistant";

export type { CodeArtifact };

/** Image attached to a user message (stored for display in thread). */
export interface MessageImage {
  name: string;
  mediaType: string;
  /** Base64 payload without a data: prefix. */
  data: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** Model reasoning / chain-of-thought (shown separately from the reply). */
  thinking?: string;
  createdAt: number;
  sources?: SearchSource[];
  images?: MessageImage[];
  /** Live UI/code previews attached to an assistant message. */
  artifacts?: CodeArtifact[];
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
