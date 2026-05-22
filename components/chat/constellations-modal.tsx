"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  ListTodo,
  StickyNote,
  FolderKanban,
  Link2,
  Pencil,
  Trash2,
  Check,
  ExternalLink,
  Copy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useOrbitStore } from "@/stores/use-orbit-store";
import { useHyperlaneStore } from "@/stores/use-hyperlane-store";
import type { Task, Note, Project, TaskPriority } from "@/types/orbit";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ConstellationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = "tasks" | "notes" | "projects" | "links";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "tasks", label: "Tasks", icon: ListTodo },
  { key: "notes", label: "Notes", icon: StickyNote },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "links", label: "Links", icon: Link2 },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function matchesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function ConstellationsModal({
  open,
  onOpenChange,
}: ConstellationsModalProps) {
  const [tab, setTab] = useState<Tab>("tasks");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const tasks = useOrbitStore((s) => s.tasks);
  const notes = useOrbitStore((s) => s.notes);
  const projects = useOrbitStore((s) => s.projects);
  const updateTask = useOrbitStore((s) => s.updateTask);
  const deleteTask = useOrbitStore((s) => s.deleteTask);
  const updateNote = useOrbitStore((s) => s.updateNote);
  const deleteNote = useOrbitStore((s) => s.deleteNote);
  const updateProject = useOrbitStore((s) => s.updateProject);
  const deleteProject = useOrbitStore((s) => s.deleteProject);
  const links = useHyperlaneStore((s) => s.history);
  const removeLink = useHyperlaneStore((s) => s.removeEntry);

  const q = query.trim();

  const filteredTasks = useMemo(() => {
    const list = tasks.filter((t) => !t.archived);
    if (!q) return list;
    return list.filter(
      (t) =>
        matchesQuery(t.title, q) ||
        matchesQuery(t.description ?? "", q) ||
        t.subtasks.some((s) => matchesQuery(s.title, q)),
    );
  }, [tasks, q]);

  const filteredNotes = useMemo(() => {
    if (!q) return notes;
    return notes.filter(
      (n) => matchesQuery(n.title, q) || matchesQuery(n.content, q),
    );
  }, [notes, q]);

  const filteredProjects = useMemo(() => {
    if (!q) return projects;
    return projects.filter(
      (p) =>
        matchesQuery(p.name, q) || matchesQuery(p.description ?? "", q),
    );
  }, [projects, q]);

  const filteredLinks = useMemo(() => {
    if (!q) return links;
    return links.filter(
      (l) =>
        matchesQuery(l.shortUrl, q) || matchesQuery(l.originalUrl, q),
    );
  }, [links, q]);

  const counts = {
    tasks: filteredTasks.length,
    notes: filteredNotes.length,
    projects: filteredProjects.length,
    links: filteredLinks.length,
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setEditingId(null);
      setQuery("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 nebula-overlay backdrop-blur-md z-50"
                onClick={() => handleOpenChange(false)}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className={cn(
                  "nebula-modal-panel fixed z-50 flex flex-col w-full",
                  "inset-x-0 bottom-0 max-h-[min(92dvh,100%)] rounded-t-2xl",
                  "pb-[env(safe-area-inset-bottom,0px)]",
                  "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2",
                  "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[88vh] sm:max-w-lg sm:rounded-2xl sm:pb-0",
                )}
              >
                <div className="shrink-0 p-5 pb-4 sm:p-6 border-b border-border">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <Dialog.Title className="text-lg sm:text-xl font-semibold tracking-tight text-text-primary">
                      Orbit
                    </Dialog.Title>
                    <Dialog.Close className="flex items-center justify-center w-9 h-9 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors">
                      <X size={18} />
                    </Dialog.Close>
                  </div>
                  <p className="text-xs sm:text-sm text-text-muted">
                    Tasks, notes, projects, and links Luna created through
                    constellations.
                  </p>

                  <div className="relative mt-4 mb-0">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                    />
                    <input
                      type="search"
                      placeholder="Search…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-bg border border-border text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-text-muted transition-colors"
                    />
                  </div>

                  <div className="flex gap-1 p-1 mt-3 rounded-xl bg-bg border border-border overflow-x-auto">
                    {TABS.map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setTab(key);
                          setEditingId(null);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                          tab === key
                            ? "bg-surface-elevated text-text-primary shadow-sm"
                            : "text-text-muted hover:text-text-secondary",
                        )}
                      >
                        <Icon size={14} />
                        {label}
                        <span className="text-xs text-text-muted tabular-nums">
                          {counts[key]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:pb-6">
                  {tab === "tasks" && (
                    <TaskList
                      tasks={filteredTasks}
                      editingId={editingId}
                      onEdit={setEditingId}
                      onUpdate={updateTask}
                      onDelete={(id) => {
                        if (confirm("Delete this task?")) deleteTask(id);
                      }}
                      onToggleComplete={(t) =>
                        updateTask(t.id, { completed: !t.completed })
                      }
                    />
                  )}
                  {tab === "notes" && (
                    <NoteList
                      notes={filteredNotes}
                      editingId={editingId}
                      onEdit={setEditingId}
                      onUpdate={updateNote}
                      onDelete={(id) => {
                        if (confirm("Delete this note?")) deleteNote(id);
                      }}
                    />
                  )}
                  {tab === "projects" && (
                    <ProjectList
                      projects={filteredProjects}
                      tasks={tasks}
                      notes={notes}
                      editingId={editingId}
                      onEdit={setEditingId}
                      onUpdate={updateProject}
                      onDelete={(id) => {
                        if (confirm("Delete this project?")) deleteProject(id);
                      }}
                    />
                  )}
                  {tab === "links" && (
                    <LinkList
                      links={filteredLinks}
                      onDelete={(id) => {
                        if (confirm("Remove this link from history?"))
                          removeLink(id);
                      }}
                    />
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm text-text-muted text-center py-12 px-4">{message}</p>
  );
}

function TaskList({
  tasks,
  editingId,
  onEdit,
  onUpdate,
  onDelete,
  onToggleComplete,
}: {
  tasks: Task[];
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (task: Task) => void;
}) {
  if (tasks.length === 0) {
    return <EmptyState message="No tasks yet. Ask Luna to create one." />;
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) =>
        editingId === task.id ? (
          <TaskEditor
            key={task.id}
            task={task}
            onSave={(patch) => {
              onUpdate(task.id, patch);
              onEdit(null);
            }}
            onCancel={() => onEdit(null)}
          />
        ) : (
          <li
            key={task.id}
            className="group flex items-start gap-3 p-3 rounded-xl bg-bg border border-border hover:border-text-muted/30 transition-colors"
          >
            <Checkbox
              checked={task.completed}
              onChange={() => onToggleComplete(task)}
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium text-text-primary truncate",
                  task.completed && "line-through text-text-muted",
                )}
              >
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                  {task.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <PriorityBadge priority={task.priority} />
                {task.dueDate && (
                  <span className="text-xs text-text-muted">{task.dueDate}</span>
                )}
                <span className="text-xs text-text-muted">
                  {formatDate(task.createdAt)}
                </span>
              </div>
            </div>
            <ItemActions
              onEdit={() => onEdit(task.id)}
              onDelete={() => onDelete(task.id)}
            />
          </li>
        ),
      )}
    </ul>
  );
}

function TaskEditor({
  task,
  onSave,
  onCancel,
}: {
  task: Task;
  onSave: (patch: Partial<Task>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");

  return (
    <li className="p-3 rounded-xl bg-bg border border-luna/30 space-y-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-text-muted resize-none"
      />
      <div className="flex gap-2 flex-wrap">
        <Select
          value={priority}
          options={PRIORITY_OPTIONS}
          onChange={(v) => setPriority(v as TaskPriority)}
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary outline-none"
        />
      </div>
      <EditorActions
        onCancel={onCancel}
        onSave={() =>
          title.trim() &&
          onSave({
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            dueDate: dueDate || undefined,
          })
        }
        saveDisabled={!title.trim()}
      />
    </li>
  );
}

function NoteList({
  notes,
  editingId,
  onEdit,
  onUpdate,
  onDelete,
}: {
  notes: Note[];
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Note>) => void;
  onDelete: (id: string) => void;
}) {
  if (notes.length === 0) {
    return <EmptyState message="No notes yet. Ask Luna to save one." />;
  }

  return (
    <ul className="space-y-2">
      {notes.map((note) =>
        editingId === note.id ? (
          <NoteEditor
            key={note.id}
            note={note}
            onSave={(patch) => {
              onUpdate(note.id, patch);
              onEdit(null);
            }}
            onCancel={() => onEdit(null)}
          />
        ) : (
          <li
            key={note.id}
            className="group p-3 rounded-xl bg-bg border border-border hover:border-text-muted/30 transition-colors"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {note.title}
                </p>
                {note.content && (
                  <p className="text-xs text-text-secondary mt-1 line-clamp-3 whitespace-pre-wrap">
                    {note.content}
                  </p>
                )}
                <span className="text-xs text-text-muted mt-1.5 block">
                  {formatDate(note.createdAt)}
                </span>
              </div>
              <ItemActions
                onEdit={() => onEdit(note.id)}
                onDelete={() => onDelete(note.id)}
              />
            </div>
          </li>
        ),
      )}
    </ul>
  );
}

function NoteEditor({
  note,
  onSave,
  onCancel,
}: {
  note: Note;
  onSave: (patch: Partial<Note>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  return (
    <li className="p-3 rounded-xl bg-bg border border-luna/30 space-y-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-text-muted resize-none"
      />
      <EditorActions
        onCancel={onCancel}
        onSave={() =>
          title.trim() && onSave({ title: title.trim(), content })
        }
        saveDisabled={!title.trim()}
      />
    </li>
  );
}

function ProjectList({
  projects,
  tasks,
  notes,
  editingId,
  onEdit,
  onUpdate,
  onDelete,
}: {
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Project>) => void;
  onDelete: (id: string) => void;
}) {
  if (projects.length === 0) {
    return <EmptyState message="No projects yet." />;
  }

  return (
    <ul className="space-y-2">
      {projects.map((project) => {
        const taskCount = tasks.filter((t) => t.projectId === project.id).length;
        const noteCount = notes.filter((n) => n.projectId === project.id).length;

        return editingId === project.id ? (
          <ProjectEditor
            key={project.id}
            project={project}
            onSave={(patch) => {
              onUpdate(project.id, patch);
              onEdit(null);
            }}
            onCancel={() => onEdit(null)}
          />
        ) : (
          <li
            key={project.id}
            className="group p-3 rounded-xl bg-bg border border-border hover:border-text-muted/30 transition-colors"
          >
            <div className="flex items-start gap-2">
              <div
                className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-luna"
                title={project.color}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {project.name}
                </p>
                {project.description && (
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <p className="text-xs text-text-muted mt-1">
                  {taskCount} tasks · {noteCount} notes
                  {project.deadline ? ` · due ${project.deadline}` : ""}
                </p>
              </div>
              <ItemActions
                onEdit={() => onEdit(project.id)}
                onDelete={() => onDelete(project.id)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ProjectEditor({
  project,
  onSave,
  onCancel,
}: {
  project: Project;
  onSave: (patch: Partial<Project>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [deadline, setDeadline] = useState(project.deadline ?? "");

  return (
    <li className="p-3 rounded-xl bg-bg border border-luna/30 space-y-3">
      <Input value={name} onChange={(e) => setName(e.target.value)} />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={2}
        className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-primary outline-none resize-none"
      />
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary outline-none"
      />
      <EditorActions
        onCancel={onCancel}
        onSave={() =>
          name.trim() &&
          onSave({
            name: name.trim(),
            description: description.trim() || undefined,
            deadline: deadline || undefined,
          })
        }
        saveDisabled={!name.trim()}
      />
    </li>
  );
}

function LinkList({
  links,
  onDelete,
}: {
  links: { id: string; shortUrl: string; originalUrl: string; createdAt: number }[];
  onDelete: (id: string) => void;
}) {
  if (links.length === 0) {
    return <EmptyState message="No shortened links yet." />;
  }

  return (
    <ul className="space-y-2">
      {links.map((link) => (
        <LinkRow key={link.id} link={link} onDelete={() => onDelete(link.id)} />
      ))}
    </ul>
  );
}

function LinkRow({
  link,
  onDelete,
}: {
  link: { id: string; shortUrl: string; originalUrl: string };
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(link.shortUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <li className="group flex items-center gap-2 p-3 rounded-xl bg-bg border border-border">
      <Link2 size={14} className="text-text-muted shrink-0" />
      <div className="flex-1 min-w-0">
        <a
          href={link.shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-text-primary hover:underline truncate block"
        >
          {link.shortUrl}
        </a>
        <span className="text-xs text-text-muted truncate block">
          {link.originalUrl}
        </span>
      </div>
      <button
        type="button"
        onClick={copy}
        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover"
        title="Copy"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <a
        href={link.shortUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover"
      >
        <ExternalLink size={14} />
      </a>
      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-subtle opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const styles = {
    low: "text-text-muted bg-surface-hover",
    medium: "text-text-secondary bg-surface-hover",
    high: "text-warning bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)]",
  };
  return (
    <span
      className={cn(
        "text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-md",
        styles[priority],
      )}
    >
      {priority}
    </span>
  );
}

function ItemActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
      <button
        type="button"
        onClick={onEdit}
        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover"
        title="Edit"
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-subtle"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function EditorActions({
  onCancel,
  onSave,
  saveDisabled,
}: {
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={saveDisabled}
        onClick={onSave}
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-accent text-accent-fg hover:opacity-90 disabled:opacity-40"
      >
        Save
      </button>
    </div>
  );
}
