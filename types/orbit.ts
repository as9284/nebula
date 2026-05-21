export type TaskPriority = "low" | "medium" | "high";

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  completed: boolean;
  archived: boolean;
  subtasks: SubTask[];
  projectId?: string;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  projectId?: string;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  deadline?: string;
  taskIds: string[];
  noteIds: string[];
  createdAt: number;
}
