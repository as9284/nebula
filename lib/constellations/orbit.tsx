"use client";

import type {
  ConstellationHandler,
  ParsedCommand,
  ActionResult,
} from "../constellation-registry";
import { sanitizeForPrompt } from "../constellation-registry";
import { useOrbitStore } from "@/stores/use-orbit-store";
import { TaskCard } from "@/components/cards/task-card";
import type { TaskPriority } from "@/types/orbit";

function OrbitResultCard({ result }: { result: ActionResult }) {
  return <TaskCard result={result} />;
}

export const orbitHandler: ConstellationHandler = {
  tag: "orbit-commands",
  name: "Orbit",
  multiCommand: true,

  promptInstructions: `### Orbit — Tasks, Notes, Projects
\`\`\`orbit-commands
CREATE_TASK {"title":"...","priority":"low|medium|high","dueDate":"YYYY-MM-DD"}
CREATE_NOTE {"title":"...","content":"..."}
CREATE_PROJECT {"name":"...","color":"violet"}
COMPLETE_TASK {"id":"..."}
DELETE_TASK {"id":"..."}
\`\`\`
Use task/note IDs from context when updating existing items.`,

  buildContext(): string {
    const { tasks, notes, projects } = useOrbitStore.getState();
    const active = tasks.filter((t) => !t.archived && !t.completed);
    if (active.length === 0 && notes.length === 0 && projects.length === 0)
      return "";

    let ctx = "## Orbit data\n";
    if (active.length) {
      ctx +=
        "**Tasks:**\n" +
        active
          .map(
            (t) =>
              `- [${t.id}] "${sanitizeForPrompt(t.title)}" (${t.priority})`,
          )
          .join("\n");
    }
    if (notes.length) {
      ctx +=
        "\n**Notes:**\n" +
        notes
          .map((n) => `- [${n.id}] "${sanitizeForPrompt(n.title)}"`)
          .join("\n");
    }
    if (projects.length) {
      ctx +=
        "\n**Projects:**\n" +
        projects
          .map((p) => `- [${p.id}] "${sanitizeForPrompt(p.name)}"`)
          .join("\n");
    }
    return ctx;
  },

  async execute(commands: ParsedCommand[]): Promise<ActionResult[]> {
    const store = useOrbitStore.getState();
    const results: ActionResult[] = [];

    for (const { command, args } of commands) {
      try {
        switch (command) {
          case "CREATE_TASK": {
            const title = String(args.title ?? "").trim();
            if (!title) break;
            const priority = (["low", "medium", "high"].includes(
              String(args.priority),
            )
              ? args.priority
              : "medium") as TaskPriority;
            const task = store.addTask({
              title,
              description: args.description
                ? String(args.description)
                : undefined,
              priority,
              dueDate: args.dueDate ? String(args.dueDate) : undefined,
            });
            results.push({
              type: "task_created",
              handler: "orbit-commands",
              title: task.title,
              id: task.id,
            });
            break;
          }
          case "CREATE_NOTE": {
            const title = String(args.title ?? "").trim();
            if (!title) break;
            const note = store.addNote({
              title,
              content: args.content ? String(args.content) : "",
            });
            results.push({
              type: "note_created",
              handler: "orbit-commands",
              title: note.title,
            });
            break;
          }
          case "CREATE_PROJECT": {
            const name = String(args.name ?? "").trim();
            if (!name) break;
            const project = store.addProject({
              name,
              color: String(args.color ?? "violet"),
            });
            results.push({
              type: "project_created",
              handler: "orbit-commands",
              title: project.name,
            });
            break;
          }
          case "COMPLETE_TASK": {
            const id = String(args.id ?? "");
            if (id) store.completeTask(id);
            results.push({
              type: "orbit_done",
              handler: "orbit-commands",
              title: "Task completed",
            });
            break;
          }
          case "DELETE_TASK": {
            const id = String(args.id ?? "");
            if (id) store.deleteTask(id);
            results.push({
              type: "orbit_done",
              handler: "orbit-commands",
              title: "Task deleted",
            });
            break;
          }
          default:
            break;
        }
      } catch (e) {
        results.push({
          type: "orbit_error",
          handler: "orbit-commands",
          message: String(e),
        });
      }
    }
    return results;
  },

  ResultCard: OrbitResultCard,
};
