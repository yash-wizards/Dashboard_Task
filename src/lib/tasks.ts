import { useSyncExternalStore } from "react";
import { z } from "zod";

export const STATUSES = ["todo", "in_progress", "done"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;

export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const taskSchema = z.object({
  title: z.string().trim().min(3, "Give the task at least 3 characters").max(100, "Keep it under 100 characters"),
  description: z.string().trim().max(500, "Keep it under 500 characters"),
  owner: z.string().trim().min(2, "Who owns this task?").max(60, "Keep it under 60 characters"),
  priority: z.enum(PRIORITIES),
  status: z.enum(STATUSES),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a due date"),
});

export type TaskInput = z.infer<typeof taskSchema>;

export interface Task extends TaskInput {
  id: string;
  createdAt: string;
}

const KEY = "pulseboard.tasks.v1";
const EMPTY: Task[] = [];
const listeners = new Set<() => void>();
let cache: Task[] | null = null;

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function seed(): Task[] {
  const now = Date.now();
  const rows: Array<Omit<Task, "id" | "createdAt">> = [
    { title: "Redesign onboarding emails", description: "Refresh copy and visuals for the 3-step welcome sequence.", owner: "Aisha", priority: "high", status: "in_progress", dueDate: daysFromNow(3) },
    { title: "Quarterly budget review", description: "Compare Q3 spend against plan with finance.", owner: "Rohan", priority: "medium", status: "todo", dueDate: daysFromNow(7) },
    { title: "Fix checkout page bug", description: "Coupon field resets when the address changes.", owner: "Meera", priority: "high", status: "done", dueDate: daysFromNow(-2) },
    { title: "Plan team offsite", description: "Shortlist three venues and send a poll.", owner: "Aisha", priority: "low", status: "todo", dueDate: daysFromNow(14) },
    { title: "Customer interview notes", description: "Summarise insights from last week's five calls.", owner: "Kabir", priority: "medium", status: "done", dueDate: daysFromNow(-5) },
    { title: "Update pricing page", description: "", owner: "Meera", priority: "medium", status: "in_progress", dueDate: daysFromNow(-1) },
  ];
  return rows.map((r, i) => ({ ...r, id: `seed-${i}`, createdAt: new Date(now - i * 3_600_000 * 9).toISOString() }));
}

function read(): Task[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Task[]) : seed();
    if (!raw) window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    cache = seed();
  }
  return cache;
}

function write(next: Task[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked — keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTasks(): Task[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function addTask(input: TaskInput): Task {
  const task: Task = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  write([task, ...read()]);
  return task;
}

export function updateStatus(id: string, status: Status) {
  write(read().map((t) => (t.id === id ? { ...t, status } : t)));
}

export function deleteTask(id: string) {
  write(read().filter((t) => t.id !== id));
}

export function isOverdue(t: Pick<Task, "status" | "dueDate">, today = new Date().toISOString().slice(0, 10)) {
  return t.status !== "done" && t.dueDate < today;
}

export function formatDate(iso: string) {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
