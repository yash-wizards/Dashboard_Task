import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlarmClock,
  CheckCircle2,
  Flag,
  Layers,
  Loader,
  PieChart,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import type { CSSProperties } from "react";

import { initials } from "@/components/AppShell";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  formatDate,
  isOverdue,
  useTasks,
} from "@/lib/tasks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Pulseboard" },
      { name: "description", content: "See task progress, priorities, team workload and what's due next." },
      { property: "og:title", content: "Dashboard — Pulseboard" },
      { property: "og:description", content: "See task progress, priorities, team workload and what's due next." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

function DashboardPage() {
  const tasks = useTasks();
  const total = tasks.length;
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, tasks.filter((t) => t.status === s).length])) as Record<
    (typeof STATUSES)[number],
    number
  >;
  const overdue = tasks.filter((t) => isOverdue(t));
  const donePct = pct(byStatus.done, total);
  const progressPct = pct(byStatus.in_progress, total);

  const owners = Object.entries(
    tasks.reduce<Record<string, { open: number; done: number }>>((acc, t) => {
      const o = (acc[t.owner] ??= { open: 0, done: 0 });
      if (t.status === "done") o.done++;
      else o.open++;
      return acc;
    }, {}),
  ).sort((a, b) => b[1].open + b[1].done - (a[1].open + a[1].done));
  const maxOwner = Math.max(1, ...owners.map(([, v]) => v.open + v.done));

  const upcoming = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);
  const recent = [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  const stats = [
    { label: "Total tasks", value: total, icon: Layers, hero: true },
    { label: "Completed", value: byStatus.done, icon: CheckCircle2 },
    { label: "In progress", value: byStatus.in_progress, icon: Loader },
    { label: "Overdue", value: overdue.length, icon: AlarmClock },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">Insights</div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">A quick look at how work is moving across your team.</p>
        </div>
        <Link to="/new" className="btn btn-primary"><Plus size={16} /> New task</Link>
      </header>

      <section className="stats">
        {stats.map((s, i) => (
          <div key={s.label} className={`stat ${s.hero ? "stat-hero" : ""}`} style={{ animationDelay: `${i * 70}ms` }}>
            <div className="stat-icon"><s.icon size={20} /></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="dash-grid">
        <div className="card">
          <div className="card-title"><PieChart size={18} /> Status breakdown</div>
          <div className="card-sub">{donePct}% of all tasks are complete</div>
          <div className="donut-wrap">
            <div className={`donut ${total === 0 ? "is-empty" : ""}`}
              style={{ "--p1": donePct, "--p2": donePct + progressPct } as CSSProperties}>
              <div className="donut-center">
                <strong>{donePct}%</strong>
                <span>done</span>
              </div>
            </div>
            <div className="legend">
              {STATUSES.map((s) => (
                <div key={s} className={`legend-row legend-${s}`}>
                  <span className="dot" /> <span>{STATUS_LABEL[s]}</span>
                  <b>{byStatus[s]}</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title"><Flag size={18} /> By priority</div>
          <div className="card-sub">How urgent the workload is</div>
          <div className="bars">
            {[...PRIORITIES].reverse().map((p) => {
              const n = tasks.filter((t) => t.priority === p).length;
              return (
                <div key={p} className="bar-row">
                  <div className="bar-head"><span>{PRIORITY_LABEL[p]}</span><span>{n} {n === 1 ? "task" : "tasks"}</span></div>
                  <div className="bar-track">
                    <div className={`bar-fill tone-${p}`} style={{ "--w": `${pct(n, total)}%` } as CSSProperties} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="dash-grid-3">
        <div className="card">
          <div className="card-title"><Users size={18} /> Team workload</div>
          <div className="card-sub">Tasks per person</div>
          <div className="bars">
            {owners.length === 0 && <div className="card-sub">No owners yet.</div>}
            {owners.slice(0, 5).map(([name, v]) => (
              <div key={name} className="bar-row">
                <div className="bar-head"><span>{name}</span><span>{v.open} open · {v.done} done</span></div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ "--w": `${pct(v.open + v.done, maxOwner)}%` } as CSSProperties} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title"><AlarmClock size={18} /> Due next</div>
          <div className="card-sub">Open tasks by due date</div>
          <div className="mini-list">
            {upcoming.length === 0 && <div className="card-sub">All caught up 🎉</div>}
            {upcoming.map((t) => (
              <div key={t.id} className="mini-item">
                <span className="avatar">{initials(t.owner)}</span>
                <div className="grow">
                  <div>{t.title}</div>
                  <div>{formatDate(t.dueDate)}</div>
                </div>
                {isOverdue(t) ? (
                  <span className="badge badge-overdue">Overdue</span>
                ) : (
                  <span className={`badge badge-${t.status}`}>{STATUS_LABEL[t.status]}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title"><Sparkles size={18} /> Recently added</div>
          <div className="card-sub">Latest entries from the form</div>
          <div className="mini-list">
            {recent.length === 0 && <div className="card-sub">Nothing added yet.</div>}
            {recent.map((t) => (
              <div key={t.id} className="mini-item">
                <span className={`dot prio-${t.priority}`} />
                <div className="grow">
                  <div>{t.title}</div>
                  <div>{t.owner} · {PRIORITY_LABEL[t.priority]} priority</div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/tasks" className="btn btn-ghost" style={{ width: "100%", marginTop: "1rem" }}>View all tasks</Link>
        </div>
      </section>
    </div>
  );
}
