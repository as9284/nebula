"use client";

import { ListTodo } from "lucide-react";
import type { ActionResult } from "@/lib/constellation-registry";

export function TaskCard({ result }: { result: ActionResult }) {
  if (result.type === "orbit_error") {
    return (
      <div className="tool-card tool-card-error">
        <span>{String(result.message)}</span>
      </div>
    );
  }
  const title = String(result.title ?? "Task");
  const label =
    result.type === "task_created"
      ? "Task created"
      : result.type === "note_created"
        ? "Note created"
        : result.type === "project_created"
          ? "Project created"
          : title;

  return (
    <div className="tool-card">
      <ListTodo size={14} className="text-text-secondary shrink-0" />
      <span>
        {label}
        {result.type === "task_created" ||
        result.type === "note_created" ||
        result.type === "project_created"
          ? ` · ${title}`
          : null}
      </span>
    </div>
  );
}
