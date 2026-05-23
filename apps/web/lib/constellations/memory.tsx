"use client";

import { Brain } from "lucide-react";
import type {
  ConstellationHandler,
  ParsedCommand,
  ActionResult,
} from "../constellation-registry";
import { sanitizeForPrompt } from "../constellation-registry";
import { MAX_MEMORY_LENGTH } from "@nebula/core/memory";
import { useLunaStore } from "@/stores/use-luna-store";

function MemoryResultCard({ result }: { result: ActionResult }) {
  const label =
    result.type === "memory_removed" ? "Removed from memory" : "Saved to memory";
  const detail = String(result.title ?? result.text ?? "").trim();

  return (
    <div className="tool-card">
      <Brain size={14} className="text-text-secondary shrink-0" />
      <span>
        {label}
        {detail ? ` · ${detail}` : null}
      </span>
    </div>
  );
}

export const memoryHandler: ConstellationHandler = {
  tag: "memory-commands",
  name: "Luna memory",
  multiCommand: true,

  promptInstructions: `### Luna memory — cross-chat facts (Settings → Memories)
Persistent facts about the user, injected into every future chat. NOT Orbit notes.

\`\`\`memory-commands
SAVE_MEMORY {"text":"..."}
DELETE_MEMORY {"id":"..."}
DELETE_MEMORY {"text":"..."}
\`\`\`

When the user says "remember", "store in memory", "don't forget", or shares a lasting personal fact to retain, use SAVE_MEMORY — never CREATE_NOTE.`,

  buildContext(): string {
    const { memories } = useLunaStore.getState();
    if (memories.length === 0) return "";
    const lines = memories
      .slice(0, 12)
      .map((m) => `- [${m.id}] "${sanitizeForPrompt(m.text)}"`);
    const extra =
      memories.length > 12 ? `\n- …and ${memories.length - 12} more` : "";
    return `## Luna memories (${memories.length} stored)\n${lines.join("\n")}${extra}`;
  },

  async execute(commands: ParsedCommand[]): Promise<ActionResult[]> {
    const store = useLunaStore.getState();
    const results: ActionResult[] = [];

    for (const { command, args } of commands) {
      try {
        switch (command) {
          case "SAVE_MEMORY": {
            const text = String(args.text ?? "").trim();
            if (!text) break;
            if (text.length > MAX_MEMORY_LENGTH) {
              results.push({
                type: "memory_error",
                handler: "memory-commands",
                message: `Memory must be ${MAX_MEMORY_LENGTH} characters or fewer`,
              });
              break;
            }
            const exists = store.memories.some(
              (m) => m.text.trim().toLowerCase() === text.toLowerCase(),
            );
            if (!exists) {
              store.addMemories([text]);
            }
            results.push({
              type: "memory_saved",
              handler: "memory-commands",
              title: text,
              text,
            });
            break;
          }
          case "DELETE_MEMORY": {
            const id = String(args.id ?? "").trim();
            const text = String(args.text ?? "").trim();
            if (id) {
              const memory = store.memories.find((m) => m.id === id);
              if (memory) {
                store.removeMemory(id);
                results.push({
                  type: "memory_removed",
                  handler: "memory-commands",
                  title: memory.text,
                  text: memory.text,
                });
              }
              break;
            }
            if (text) {
              const memory = store.memories.find(
                (m) => m.text.toLowerCase() === text.toLowerCase(),
              );
              if (memory) {
                store.removeMemory(memory.id);
                results.push({
                  type: "memory_removed",
                  handler: "memory-commands",
                  title: memory.text,
                  text: memory.text,
                });
              }
            }
            break;
          }
          default:
            results.push({
              type: "memory_error",
              handler: "memory-commands",
              message: `Unknown command: ${command}`,
            });
            break;
        }
      } catch (e) {
        results.push({
          type: "memory_error",
          handler: "memory-commands",
          message: String(e),
        });
      }
    }
    return results;
  },

  ResultCard: MemoryResultCard,
};
