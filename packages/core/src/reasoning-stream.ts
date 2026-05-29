import type { LlmConfig } from "./llm-config";

export interface StreamDelta {
  content?: string;
  reasoning?: string;
}

export interface LlmStreamResult {
  content: string;
  thinking: string;
}

export interface LlmStreamHandlers {
  onContent?: (text: string) => void;
  onReasoning?: (text: string) => void;
}

/** Models/endpoints that support reasoning_split (MiniMax M2+, etc.). */
export function shouldUseReasoningSplit(config: LlmConfig): boolean {
  const model = config.model.toLowerCase();
  const url = config.baseUrl.toLowerCase();
  if (url.includes("minimax")) return true;
  if (/minimax-m2/i.test(model)) return true;
  if (/deepseek-reasoner/i.test(model)) return true;
  return false;
}

type OpenAiDelta = {
  content?: string | null;
  /** LM Studio / o-series style reasoning stream field */
  reasoning?: string | null;
  reasoning_content?: string | null;
  reasoning_details?: { type?: string; text?: string }[] | null;
};

type OpenAiChoice = {
  delta?: OpenAiDelta;
  message?: { content?: string | null };
};

/** Stateful parser for OpenAI-compatible SSE chunks (handles cumulative snapshots). */
export class OpenAiStreamDeltaParser {
  private reasoningTrackers = new Map<number, StreamFieldTracker>();

  parse(raw: unknown): StreamDelta {
    const choices = (raw as { choices?: OpenAiChoice[] })?.choices;
    const choice = choices?.[0];
    const delta = choice?.delta;
    const out: StreamDelta = {};

    if (delta) {
      if (typeof delta.content === "string" && delta.content) {
        out.content = delta.content;
      }

      if (typeof delta.reasoning === "string" && delta.reasoning) {
        out.reasoning = delta.reasoning;
      }

      if (Array.isArray(delta.reasoning_details)) {
        let reasoning = "";
        for (let i = 0; i < delta.reasoning_details.length; i++) {
          const detail = delta.reasoning_details[i];
          if (!detail?.text) continue;
          let tracker = this.reasoningTrackers.get(i);
          if (!tracker) {
            tracker = new StreamFieldTracker();
            this.reasoningTrackers.set(i, tracker);
          }
          reasoning += tracker.push(detail.text);
        }
        if (reasoning) out.reasoning = reasoning;
      } else if (
        typeof delta.reasoning_content === "string" &&
        delta.reasoning_content
      ) {
        out.reasoning = delta.reasoning_content;
      }
    }

    const messageContent = choice?.message?.content;
    if (
      !out.content &&
      typeof messageContent === "string" &&
      messageContent
    ) {
      out.content = messageContent;
    }

    return out;
  }
}

export function parseOpenAiStreamDelta(raw: unknown): StreamDelta {
  return new OpenAiStreamDeltaParser().parse(raw);
}

const EMBEDDED_THINK_BLOCK_RE =
  /<(?:think|monologue|redacted_thinking)>([\s\S]*?)<\/(?:think|monologue|redacted_thinking)>/gi;
const STRAY_THINK_TAG_RE = /<\/?(?:think|monologue|redacted_thinking)>/gi;

/** Strip embedded think/monologue blocks from model output. */
export function splitEmbeddedThinking(text: string): {
  content: string;
  thinking: string;
} {
  const thinkingParts: string[] = [];
  const content = text
    .replace(EMBEDDED_THINK_BLOCK_RE, (_, inner: string) => {
      const trimmed = inner.trim();
      if (trimmed) thinkingParts.push(trimmed);
      return "";
    })
    .replace(STRAY_THINK_TAG_RE, "")
    .trim();

  return {
    content,
    thinking: thinkingParts.join("\n\n").trim(),
  };
}

export function mergeThinking(...parts: (string | undefined)[]): string {
  return parts
    .map((p) => p?.trim())
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Emits only new text when providers send cumulative snapshots per chunk
 * (common with MiniMax reasoning_details).
 */
export class StreamFieldTracker {
  private snapshot = "";

  push(next: string): string {
    if (!next) return "";
    if (!this.snapshot) {
      this.snapshot = next;
      return next;
    }
    if (next.startsWith(this.snapshot)) {
      const delta = next.slice(this.snapshot.length);
      this.snapshot = next;
      return delta;
    }
    this.snapshot += next;
    return next;
  }
}

const THINK_OPEN_TAGS = ["\x3cthink\x3e", "\x3cmonologue\x3e"] as const;
const THINK_CLOSE_TAGS = ["\x3c/think\x3e", "\x3c/monologue\x3e"] as const;

/** Incrementally separates think/monologue blocks when embedded in content. */
export class ThinkTagStreamSplitter {
  private carry = "";

  push(chunk: string): StreamDelta {
    let text = this.carry + chunk;
    this.carry = "";

    let content = "";
    let reasoning = "";

    while (text.length > 0) {
      let open = -1;
      let openLen = 0;
      for (const tag of THINK_OPEN_TAGS) {
        const idx = text.indexOf(tag);
        if (idx !== -1 && (open === -1 || idx < open)) {
          open = idx;
          openLen = tag.length;
        }
      }
      if (open === -1) {
        content += text;
        break;
      }

      content += text.slice(0, open);
      text = text.slice(open + openLen);

      let close = -1;
      let closeLen = 0;
      for (const tag of THINK_CLOSE_TAGS) {
        const idx = text.indexOf(tag);
        if (idx !== -1 && (close === -1 || idx < close)) {
          close = idx;
          closeLen = tag.length;
        }
      }
      if (close === -1) {
        this.carry = text;
        break;
      }

      reasoning += text.slice(0, close);
      text = text.slice(close + closeLen);
    }

    const out: StreamDelta = {};
    if (content) out.content = content;
    if (reasoning) out.reasoning = reasoning;
    return out;
  }

  flush(): StreamDelta {
    if (!this.carry) return {};
    const partial = this.carry;
    this.carry = "";
    return { reasoning: partial };
  }
}

export function emitStreamDelta(
  delta: StreamDelta,
  handlers: LlmStreamHandlers,
): void {
  if (delta.content) handlers.onContent?.(delta.content);
  if (delta.reasoning) handlers.onReasoning?.(delta.reasoning);
}

/** Lets React paint between streamed tokens when many SSE lines arrive in one read. */
export function yieldToUi(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

const STREAM_SLICE_CHARS = 3;

/**
 * When a provider sends a full reply in one chunk, slice it so the UI can render incrementally.
 */
export async function deliverStreamingText(
  text: string,
  onSlice: (slice: string) => void | Promise<void>,
): Promise<void> {
  if (!text) return;
  if (text.length <= STREAM_SLICE_CHARS) {
    await onSlice(text);
    return;
  }
  for (let i = 0; i < text.length; i += STREAM_SLICE_CHARS) {
    await onSlice(text.slice(i, i + STREAM_SLICE_CHARS));
    await yieldToUi();
  }
}
