import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Check, Flag, Inbox, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { initials } from "@/components/AppShell";
import {
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  deleteTask,
  formatDate,
  isOverdue,
  updateStatus,
  useTasks,
  type Status,
} from "@/lib/tasks";

type TasksSearch = { added?: string };

export const Route = createFileRoute("/tasks")({
  validateSearch: (search: Record<string, unknown>): TasksSearch =>
    typeof search["added"] === "string" ? { added: search["added"] } : {},
  head: () => ({
    meta: [
      { title: "All tasks — Pulseboard" },
      { name: "description", content: "Search, filter and update every task your team is working on." },
      { property: "og:title", content: "All tasks — Pulseboard" },
      { property: "og:description", content: "Search, filter and update every task your team is working on." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasksPage,
});

type Filter = "all" | Status;

function TasksPage() {
  const { added } = Route.useSearch();
  const tasks = useTasks();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (filter === "all" || t.status === filter) &&
        (!q || t.title.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q)),
    );
  }, [tasks, query, filter]);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">Overview</div>
          <h1 className="page-title">All tasks</h1>
          <p className="page-sub">{tasks.length} tasks in total. Tick one off, change its status, or remove it.</p>
        </div>
        <Link to="/new" className="btn btn-ink"><Plus size={16} /> New task</Link>
      </header>

      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input className="input" placeholder="Search by title or owner…" value={query}
            onChange={(e) => setQuery(e.target.value)} aria-label="Search tasks" />
        </div>
        <div className="segmented" role="tablist" aria-label="Filter by status">
          {(["all", ...STATUSES] as Filter[]).map((f) => (
            <button key={f} type="button" role="tab" aria-selected={filter === f}
              className={filter === f ? "is-on" : ""} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon"><Inbox size={28} /></div>
          <h3>{tasks.length === 0 ? "No tasks yet" : "Nothing matches"}</h3>
          <p>{tasks.length === 0 ? "Add your first task to get started." : "Try a different search or filter."}</p>
          {tasks.length === 0 && <Link to="/new" className="btn btn-primary"><Plus size={16} /> Add a task</Link>}
        </div>
      ) : (
        <ul className="task-list">
          {shown.map((t, i) => {
            const overdue = isOverdue(t);
            return (
              <li key={t.id} className={`task-row ${t.status === "done" ? "is-done" : ""} ${t.id === added ? "is-new" : ""}`}
                style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
                <button type="button" className={`check ${t.status === "done" ? "is-on" : ""}`}
                  aria-label={t.status === "done" ? "Mark as to do" : "Mark as done"}
                  onClick={() => updateStatus(t.id, t.status === "done" ? "todo" : "done")}>
                  <Check size={14} strokeWidth={3} />
                </button>
                <div style={{ minWidth: 0 }}>
                  <div className="task-title">{t.title}</div>
                  {t.description && <div className="task-desc">{t.description}</div>}
                </div>
                <div className="task-meta hide-sm">
                  <span className="avatar">{initials(t.owner)}</span> {t.owner}
                </div>
                <div className="task-meta hide-sm">
                  {overdue ? (
                    <span className="badge badge-overdue"><CalendarDays size={12} /> Overdue · {formatDate(t.dueDate)}</span>
                  ) : (
                    <><CalendarDays size={14} /> {formatDate(t.dueDate)}</>
                  )}
                </div>
                <span className={`prio prio-${t.priority} hide-sm`}><Flag size={14} /> {PRIORITY_LABEL[t.priority]}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <select className="status-select" value={t.status} aria-label="Status"
                    onChange={(e) => updateStatus(t.id, e.target.value as Status)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                  <button type="button" className="icon-btn" aria-label={`Delete ${t.title}`}
                    onClick={() => { deleteTask(t.id); toast("Task deleted", { description: t.title }); }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
