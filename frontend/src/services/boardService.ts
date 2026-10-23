import { apiFetch } from "@/lib/apiFetch";

export interface BoardColumn {
  id: string;
  title: string;
  color: string;
  order: number;
}

export interface Board {
  _id: string;
  title: string;
  description: string;
  color: string;
  columns: BoardColumn[];
  createdBy: string;
  taskCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  labels: string[];
  dueDate: string | null;
  column: string;
  board: string;
  order: number;
  createdAt: string;
  assignedTo: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null;
}

export interface BoardWithTasks {
  board: Board;
  tasks: Task[];
}

export const getMyBoards = async (): Promise<Board[]> => {
  const res = await apiFetch("/api/boards");
  if (!res.ok) throw new Error("Failed to fetch boards");
  return res.json();
};

export const createBoard = async (data: {
  title: string;
  description?: string;
  color?: string;
}): Promise<Board> => {
  const res = await apiFetch("/api/boards", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create board");
  }
  return res.json();
};

export const getBoardById = async (id: string): Promise<BoardWithTasks> => {
  const res = await apiFetch(`/api/boards/${id}`);
  if (!res.ok) throw new Error("Failed to fetch board");
  return res.json();
};

export const updateBoard = async (
  id: string,
  data: Partial<Pick<Board, "title" | "description" | "color" | "columns">>,
): Promise<Board> => {
  const res = await apiFetch(`/api/boards/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update board");
  }
  return res.json();
};

export const deleteBoard = async (id: string): Promise<void> => {
  const res = await apiFetch(`/api/boards/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete board");
};

export const createTask = async (
  boardId: string,
  data: {
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    labels?: string[];
    dueDate?: string | null;
    column: string;
    assignedTo?: string | null;
  },
): Promise<Task> => {
  const res = await apiFetch(`/api/boards/${boardId}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create task");
  }
  return res.json();
};

export const updateTask = async (
  boardId: string,
  taskId: string,
  data: Partial<Omit<Task, "_id" | "board" | "createdAt" | "assignedTo">> & {
    assignedTo?: string | null;
  },
): Promise<Task> => {
  const res = await apiFetch(`/api/boards/${boardId}/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update task");
  }
  return res.json();
};

export const moveTask = async (
  boardId: string,
  taskId: string,
  column: string,
  order: number,
): Promise<Task> => {
  const res = await apiFetch(`/api/boards/${boardId}/tasks/${taskId}/move`, {
    method: "PATCH",
    body: JSON.stringify({ column, order }),
  });
  if (!res.ok) throw new Error("Failed to move task");
  return res.json();
};

export const deleteTask = async (
  boardId: string,
  taskId: string,
): Promise<void> => {
  const res = await apiFetch(`/api/boards/${boardId}/tasks/${taskId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete task");
};
