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
  reasoning_content?: string | null;
  reasoning_details?: { type?: string; text?: string }[] | null;
};

export function parseOpenAiStreamDelta(raw: unknown): StreamDelta {
  const choices = (raw as { choices?: { delta?: OpenAiDelta }[] })?.choices;
  const delta = choices?.[0]?.delta;
  if (!delta) return {};

  const out: StreamDelta = {};

  if (typeof delta.content === "string" && delta.content) {
    out.content = delta.content;
  }

  if (typeof delta.reasoning_content === "string" && delta.reasoning_content) {
    out.reasoning = delta.reasoning_content;
  }

  if (Array.isArray(delta.reasoning_details)) {
    let reasoning = "";
    for (const detail of delta.reasoning_details) {
      if (detail?.text) reasoning += detail.text;
    }
    if (reasoning) out.reasoning = (out.reasoning ?? "") + reasoning;
  }

  return out;
}

/** Strip embedded `` blocks from model output. */
export function splitEmbeddedThinking(text: string): {
  content: string;
  thinking: string;
} {
  const thinkingParts: string[] = [];
  const content = text
    .replace(/([\s\S]*?)<\/think>/gi, (_, inner: string) => {
      const trimmed = inner.trim();
      if (trimmed) thinkingParts.push(trimmed);
      return "";
    })
    .replace(/<think>/gi, "")
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

/** Incrementally separates `` when providers embed thinking in content. */
export class ThinkTagStreamSplitter {
  private carry = "";

  push(chunk: string): StreamDelta {
    let text = this.carry + chunk;
    this.carry = "";

    let content = "";
    let reasoning = "";

    while (text.length > 0) {
      const open = text.indexOf("");
      if (open === -1) {
        content += text;
        break;
      }

      content += text.slice(0, open);
      text = text.slice(open + 7);

      const close = text.indexOf("");
      if (close === -1) {
        this.carry = text;
        break;
      }

      reasoning += text.slice(0, close);
      text = text.slice(close + 8);
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
