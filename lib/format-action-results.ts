import type { ActionResult } from "@/lib/constellation-registry";

export const RICH_ACTION_TYPES = new Set([
  "weather",
  "weather_error",
  "short_url",
  "short_url_error",
]);

export function isRichActionResult(result: ActionResult): boolean {
  return RICH_ACTION_TYPES.has(result.type);
}

export interface SimpleActionGroup {
  type: string;
  items: ActionResult[];
  heading: string;
  details: string[];
}

function pluralizeTaskPhrase(title: string, count: number): string {
  if (count === 1) return title;
  if (/^Task deleted$/i.test(title)) return `${count} tasks deleted`;
  if (/^Task completed$/i.test(title)) return `${count} tasks completed`;
  return `${count}× ${title}`;
}

function groupHeading(type: string, items: ActionResult[]): string {
  const count = items.length;
  if (type === "orbit_done") {
    const title = String(items[0]?.title ?? "Done");
    return pluralizeTaskPhrase(title, count);
  }
  if (type === "orbit_error") {
    const msg = String(items[0]?.message ?? "Error");
    return count === 1 ? msg : `${count} errors`;
  }
  if (type === "task_created") {
    return count === 1 ? "Task created" : `${count} tasks created`;
  }
  if (type === "note_created") {
    return count === 1 ? "Note created" : `${count} notes created`;
  }
  if (type === "project_created") {
    return count === 1 ? "Project created" : `${count} projects created`;
  }
  if (type === "sandbox_open") {
    return count === 1
      ? "Sandbox opened"
      : `${count} sandboxes opened`;
  }
  return count === 1
    ? String(items[0]?.title ?? items[0]?.message ?? type)
    : `${count} actions`;
}

function groupDetails(type: string, items: ActionResult[]): string[] {
  if (type === "orbit_done" || type === "orbit_error") return [];
  const details: string[] = [];
  for (const item of items) {
    let d: string;
    if (type === "orbit_error") {
      d = String(item.message ?? "");
    } else if (type === "sandbox_open") {
      d = `${String(item.sandboxType ?? "code")} — see side panel`;
    } else {
      d = String(item.title ?? "").trim();
    }
    if (d && !details.includes(d)) details.push(d);
  }
  return details;
}

function simpleGroupKey(result: ActionResult): string {
  if (result.type === "orbit_done") {
    return `orbit_done::${String(result.title ?? "")}`;
  }
  if (result.type === "orbit_error") {
    return `orbit_error::${String(result.message ?? "")}`;
  }
  return result.type;
}

export function groupSimpleActionResults(
  results: ActionResult[],
): SimpleActionGroup[] {
  const buckets = new Map<string, ActionResult[]>();

  for (const result of results) {
    if (isRichActionResult(result)) continue;
    const key = simpleGroupKey(result);
    const list = buckets.get(key) ?? [];
    list.push(result);
    buckets.set(key, list);
  }

  return [...buckets.values()].map((items) => ({
    type: items[0].type,
    items,
    heading: groupHeading(items[0].type, items),
    details: groupDetails(items[0].type, items),
  }));
}
