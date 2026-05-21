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
  return (
    <div className="tool-card">
      <ListTodo size={14} className="text-text-secondary shrink-0" />
      <span>
        {result.type === "task_created" ? "Task created" : "Orbit"}: {title}
      </span>
    </div>
  );
}
