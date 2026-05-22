"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Task, Note, Project } from "@/types/orbit";
import { generateId } from "@/lib/utils";
import { createIdbStorage } from "@/lib/storage";

interface OrbitState {
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "completed" | "archived" | "subtasks">) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  addNote: (note: Omit<Note, "id" | "createdAt">) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addProject: (project: Omit<Project, "id" | "createdAt" | "taskIds" | "noteIds">) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  hydrate: (data: { tasks: Task[]; notes: Note[]; projects: Project[] }) => void;
}

export const useOrbitStore = create<OrbitState>()(
  persist(
    (set, get) => ({
      tasks: [],
      notes: [],
      projects: [],
      addTask: (partial) => {
        const task: Task = {
          id: generateId(),
          title: partial.title,
          description: partial.description,
          priority: partial.priority ?? "medium",
          dueDate: partial.dueDate,
          completed: false,
          archived: false,
          subtasks: [],
          projectId: partial.projectId,
          createdAt: Date.now(),
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },
      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      completeTask: (id) => get().updateTask(id, { completed: true }),
      addNote: (partial) => {
        const note: Note = {
          id: generateId(),
          title: partial.title,
          content: partial.content ?? "",
          projectId: partial.projectId,
          createdAt: Date.now(),
        };
        set((s) => ({ notes: [note, ...s.notes] }));
        return note;
      },
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),
      deleteNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
      addProject: (partial) => {
        const project: Project = {
          id: generateId(),
          name: partial.name,
          description: partial.description,
          color: partial.color ?? "violet",
          deadline: partial.deadline,
          taskIds: [],
          noteIds: [],
          createdAt: Date.now(),
        };
        set((s) => ({ projects: [project, ...s.projects] }));
        return project;
      },
      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          tasks: s.tasks.map((t) =>
            t.projectId === id ? { ...t, projectId: undefined } : t,
          ),
          notes: s.notes.map((n) =>
            n.projectId === id ? { ...n, projectId: undefined } : n,
          ),
        })),
      hydrate: (data) =>
        set({
          tasks: data.tasks,
          notes: data.notes,
          projects: data.projects,
        }),
    }),
    {
      name: "nebula-orbit",
      storage: createJSONStorage(() => createIdbStorage("nebula-orbit")),
    },
  ),
);
