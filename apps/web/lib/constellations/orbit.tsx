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

  promptInstructions: `### Orbit — Tasks, Notes, Projects (productivity app)
Use for todos, user-visible notes, and projects — NOT for Luna cross-chat memories (use memory-commands SAVE_MEMORY instead).

\`\`\`orbit-commands
CREATE_TASK {"title":"...","priority":"low|medium|high","dueDate":"YYYY-MM-DD"}
UPDATE_TASK {"id":"...","title":"...","priority":"low|medium|high","dueDate":"YYYY-MM-DD"}
COMPLETE_TASK {"id":"..."}
DELETE_TASK {"id":"..."}
DELETE_TASKS {"ids":["id1","id2"]}
CREATE_NOTE {"title":"...","content":"..."}
UPDATE_NOTE {"id":"...","title":"...","content":"..."}
DELETE_NOTE {"id":"..."}
CREATE_PROJECT {"name":"...","color":"violet"}
DELETE_PROJECT {"id":"..."}
\`\`\`

Rules:
- Put command blocks only at the very end of your reply; never show JSON or fences in prose.
- Confirm actions in one short natural sentence; the UI shows result cards.
- Use IDs from Orbit context or [Actions executed] for updates/deletes.
- For "delete them/all", use DELETE_TASKS with every active task ID — never refuse if IDs are available.`,

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
          case "UPDATE_TASK": {
            const id = String(args.id ?? "").trim();
            if (!id) break;
            const existing = store.tasks.find((t) => t.id === id);
            if (!existing) break;
            const patch: Parameters<typeof store.updateTask>[1] = {};
            if (args.title !== undefined) patch.title = String(args.title);
            if (args.description !== undefined) {
              patch.description = String(args.description);
            }
            if (
              args.priority !== undefined &&
              ["low", "medium", "high"].includes(String(args.priority))
            ) {
              patch.priority = args.priority as TaskPriority;
            }
            if (args.dueDate !== undefined) {
              patch.dueDate = String(args.dueDate);
            }
            store.updateTask(id, patch);
            results.push({
              type: "orbit_done",
              handler: "orbit-commands",
              title: "Task updated",
              id,
              taskTitle: String(args.title ?? existing.title),
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
              id: note.id,
            });
            break;
          }
          case "UPDATE_NOTE": {
            const id = String(args.id ?? "").trim();
            if (!id) break;
            const existing = store.notes.find((n) => n.id === id);
            if (!existing) break;
            const patch: Parameters<typeof store.updateNote>[1] = {};
            if (args.title !== undefined) patch.title = String(args.title);
            if (args.content !== undefined) patch.content = String(args.content);
            store.updateNote(id, patch);
            results.push({
              type: "orbit_done",
              handler: "orbit-commands",
              title: "Note updated",
              id,
              taskTitle: String(args.title ?? existing.title),
            });
            break;
          }
          case "DELETE_NOTE": {
            const id = String(args.id ?? "").trim();
            if (!id) break;
            const note = store.notes.find((n) => n.id === id);
            store.deleteNote(id);
            results.push({
              type: "orbit_done",
              handler: "orbit-commands",
              title: "Note deleted",
              id,
              taskTitle: note?.title,
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
              id: project.id,
            });
            break;
          }
          case "DELETE_PROJECT": {
            const id = String(args.id ?? "").trim();
            if (!id) break;
            const project = store.projects.find((p) => p.id === id);
            store.deleteProject(id);
            results.push({
              type: "orbit_done",
              handler: "orbit-commands",
              title: "Project deleted",
              id,
              taskTitle: project?.name,
            });
            break;
          }
          case "COMPLETE_TASK": {
            const id = String(args.id ?? "");
            if (!id) break;
            const task = store.tasks.find((t) => t.id === id);
            store.completeTask(id);
            results.push({
              type: "orbit_done",
              handler: "orbit-commands",
              title: "Task completed",
              id,
              taskTitle: task?.title,
            });
            break;
          }
          case "DELETE_TASK": {
            const id = String(args.id ?? "");
            if (!id) break;
            const task = store.tasks.find((t) => t.id === id);
            store.deleteTask(id);
            results.push({
              type: "orbit_done",
              handler: "orbit-commands",
              title: "Task deleted",
              id,
              taskTitle: task?.title,
            });
            break;
          }
          case "DELETE_TASKS": {
            const raw = args.ids;
            const ids = Array.isArray(raw)
              ? raw.map((id) => String(id).trim()).filter(Boolean)
              : [];
            for (const id of ids) {
              const task = store.tasks.find((t) => t.id === id);
              if (task) store.deleteTask(id);
            }
            results.push({
              type: "orbit_done",
              handler: "orbit-commands",
              title:
                ids.length === 1 ? "Task deleted" : `${ids.length} tasks deleted`,
              count: ids.length,
            });
            break;
          }
          default:
            results.push({
              type: "orbit_error",
              handler: "orbit-commands",
              message: `Unknown command: ${command}`,
            });
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
