"use client";

import {
  AlertCircle,
  Brain,
  CheckCircle2,
  FileText,
  FolderKanban,
  ListTodo,
  PanelRightOpen,
} from "lucide-react";
import type { SimpleActionGroup } from "@/lib/format-action-results";

function GroupIcon({ type }: { type: string }) {
  const className = "shrink-0 text-text-secondary";
  const size = 14;
  switch (type) {
    case "task_created":
    case "orbit_done":
      return <ListTodo size={size} className={className} strokeWidth={1.5} />;
    case "note_created":
      return <FileText size={size} className={className} strokeWidth={1.5} />;
    case "project_created":
      return (
        <FolderKanban size={size} className={className} strokeWidth={1.5} />
      );
    case "orbit_error":
    case "memory_error":
    case "command_error":
      return (
        <AlertCircle size={size} className={className} strokeWidth={1.5} />
      );
    case "memory_saved":
    case "memory_removed":
      return <Brain size={size} className={className} strokeWidth={1.5} />;
    case "sandbox_open":
      return (
        <PanelRightOpen size={size} className={className} strokeWidth={1.5} />
      );
    default:
      return (
        <CheckCircle2 size={size} className={className} strokeWidth={1.5} />
      );
  }
}

export function SimpleActionGroupCard({ group }: { group: SimpleActionGroup }) {
  const isError =
    group.type === "orbit_error" ||
    group.type === "memory_error" ||
    group.type === "command_error";

  return (
    <div
      className={
        isError ? "tool-card tool-card-error" : "tool-card"
      }
    >
      <GroupIcon type={group.type} />
      <div className="min-w-0 flex-1">
        <span className="text-sm text-text-primary">{group.heading}</span>
        {group.details.length > 0 && (
          <ul className="mt-1.5 space-y-0.5 border-t border-border/60 pt-1.5">
            {group.details.map((detail) => (
              <li
                key={detail}
                className="truncate text-xs text-text-secondary before:mr-1.5 before:text-text-muted before:content-['·']"
              >
                {detail}
              </li>
            ))}
          </ul>
        )}
      </div>
      {group.items.length > 1 && group.details.length === 0 && (
        <span className="shrink-0 rounded-md bg-surface px-2 py-0.5 text-xs font-medium tabular-nums text-text-muted">
          {group.items.length}
        </span>
      )}
    </div>
  );
}
