import type { ActionResult } from "./constellation-registry";

const HISTORY_HEADER =
  "\n\n[Actions executed — saved in Nebula; use these IDs for follow-up commands]";

function formatOneResult(result: ActionResult): string | null {
  switch (result.type) {
    case "task_created": {
      const id = String(result.id ?? "").trim();
      const title = String(result.title ?? "").trim();
      if (!id || !title) return null;
      return `- Created task [${id}] "${title}"`;
    }
    case "note_created": {
      const id = String(result.id ?? "").trim();
      const title = String(result.title ?? "").trim();
      if (!id || !title) return null;
      return `- Created note [${id}] "${title}"`;
    }
    case "project_created": {
      const id = String(result.id ?? "").trim();
      const title = String(result.title ?? "").trim();
      if (!id || !title) return null;
      return `- Created project [${id}] "${title}"`;
    }
    case "orbit_done": {
      const id = String(result.id ?? "").trim();
      const title = String(result.title ?? "Done");
      const taskTitle = String(result.taskTitle ?? "").trim();
      if (id && taskTitle) {
        return `- ${title}: [${id}] "${taskTitle}"`;
      }
      if (id) return `- ${title} [${id}]`;
      return `- ${title}`;
    }
    case "orbit_error":
      return `- Error: ${String(result.message ?? "unknown")}`;
    case "weather":
      return `- Fetched weather for ${String(result.location ?? "location")}`;
    case "short_url":
      return `- Shortened URL → ${String(result.short ?? "")}`;
    case "sandbox_open":
      return `- Opened sandbox (${String(result.sandboxType ?? "code")})`;
    case "ui_artifact": {
      const artifact = result.artifact as { id?: string; title?: string } | undefined;
      const id = String(artifact?.id ?? "").trim();
      const title = String(artifact?.title ?? "UI preview").trim();
      if (!id) return `- Rendered UI artifact "${title}"`;
      return `- Rendered UI artifact "${title}" [${id}]`;
    }
    case "file_generated":
      // Download card is shown in the UI; omit from history so the model does not echo it.
      return null;
    case "file_error":
      return `- File export error: ${String(result.message ?? "unknown")}`;
    case "memory_saved": {
      const text = String(result.text ?? result.title ?? "").trim();
      if (!text) return null;
      return `- Saved to Luna memory: "${text}"`;
    }
    case "memory_removed": {
      const text = String(result.text ?? result.title ?? "").trim();
      if (!text) return null;
      return `- Removed from Luna memory: "${text}"`;
    }
    case "memory_error":
      return `- Memory error: ${String(result.message ?? "unknown")}`;
    default:
      return null;
  }
}

const ACTION_HISTORY_BLOCK_RE =
  /\n*\[Actions executed[^\]]*\][\s\S]*$/i;

/** Internal action-summary lines the model sometimes echoes into visible chat. */
const LEAKED_ACTION_LINE_RE =
  /^- (?:Generated file|Created task|Created note|Created project|Rendered UI artifact|Saved to Luna memory|Removed from Luna memory|Opened sandbox|Shortened URL →|Fetched weather for|File export error|Error:)[^\n]*\n?/gim;

/** Remove leaked action-history blocks from user-visible assistant text. */
export function stripLeakedActionHistoryFromDisplay(content: string): string {
  let cleaned = content.replace(ACTION_HISTORY_BLOCK_RE, "");
  cleaned = cleaned.replace(LEAKED_ACTION_LINE_RE, "");
  return cleaned.replace(/\n{3,}/g, "\n\n").trimEnd();
}

/** Append to assistant turns in API history only (not shown in the chat UI). */
export function formatActionResultsForHistory(
  results: ActionResult[],
): string {
  const lines = results
    .map(formatOneResult)
    .filter((line): line is string => line !== null);
  if (lines.length === 0) return "";
  return `${HISTORY_HEADER}\n${lines.join("\n")}`;
}
