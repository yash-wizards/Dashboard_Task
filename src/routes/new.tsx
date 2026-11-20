import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import {
  AlignLeft,
  CalendarDays,
  CircleDot,
  Flag,
  Lightbulb,
  RotateCcw,
  Send,
  Type,
  User,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  addTask,
  formatDate,
  taskSchema,
  type Priority,
  type Status,
  type TaskInput,
} from "@/lib/tasks";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "New task — Pulseboard" },
      { name: "description", content: "Add a new task with an owner, priority, status and due date." },
      { property: "og:title", content: "New task — Pulseboard" },
      { property: "og:description", content: "Add a new task with an owner, priority, status and due date." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewTaskPage,
});

type Errors = Partial<Record<keyof TaskInput, string>>;

const blank: TaskInput = { title: "", description: "", owner: "", priority: "medium", status: "todo", dueDate: "" };

const PRIORITY_DOT: Record<Priority, string> = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
};

function Field({ id, label, icon, error, className, children }: {
  id?: string; label: ReactNode; icon: ReactNode; error?: string | undefined; className?: string; children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id} className="flex items-center gap-1.5 text-[0.82rem] font-bold [&_svg]:size-3.5 [&_svg]:text-muted-foreground">
        {icon} {label}
      </Label>
      {children}
      {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
}

const inputCls = "h-11 rounded-lg border-input bg-background text-[0.95rem] shadow-none focus-visible:ring-2 aria-invalid:border-destructive";

function NewTaskPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<TaskInput>(blank);
  const [errors, setErrors] = useState<Errors>({});
  const [dateOpen, setDateOpen] = useState(false);

  function set<K extends keyof TaskInput>(key: K, value: TaskInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = taskSchema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof TaskInput;
        if (!next[k]) next[k] = issue.message;
      }
      setErrors(next);
      return;
    }
    const task = addTask(parsed.data);
    toast.success("Task added", { description: task.title });
    navigate({ to: "/tasks", search: { added: task.id } });
  }

  return (
    <div className="animate-page mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Create"
        title="Add a new task"
        description="Fill in the details below. Once saved, it shows up in your task list and dashboard."
      />

      <div className="grid gap-6 @4xl/main:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] @4xl/main:items-start">
        <Card className="overflow-hidden">
          <form onSubmit={onSubmit} noValidate>
            <CardHeader>
              <CardTitle>Task details</CardTitle>
              <CardDescription>Fields marked optional can be left blank.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 @xl/main:grid-cols-2">
              <Field id="title" label="Task title" icon={<Type />} error={errors.title} className="@xl/main:col-span-2">
                <Input id="title" className={inputCls} placeholder="e.g. Launch the spring campaign" maxLength={100}
                  value={values.title} aria-invalid={!!errors.title} onChange={(e) => set("title", e.target.value)} />
              </Field>

              <Field id="description" label={<>Description <span className="font-medium text-muted-foreground">(optional)</span></>}
                icon={<AlignLeft />} error={errors.description} className="@xl/main:col-span-2">
                <Textarea id="description" className={cn(inputCls, "h-auto min-h-28 py-3")} placeholder="What needs to happen?"
                  maxLength={500} value={values.description} aria-invalid={!!errors.description}
                  onChange={(e) => set("description", e.target.value)} />
              </Field>

              <Field id="owner" label="Owner" icon={<User />} error={errors.owner}>
                <Input id="owner" className={inputCls} placeholder="Who's on it?" maxLength={60}
                  value={values.owner} aria-invalid={!!errors.owner} onChange={(e) => set("owner", e.target.value)} />
              </Field>

              <Field id="dueDate" label="Due date" icon={<CalendarDays />} error={errors.dueDate}>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button id="dueDate" type="button" variant="outline" aria-invalid={!!errors.dueDate}
                      className={cn(inputCls, "w-full justify-start px-3 font-medium hover:bg-background", !values.dueDate && "text-muted-foreground")}>
                      <CalendarDays />
                      {values.dueDate ? format(parseISO(values.dueDate), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single"
                      selected={values.dueDate ? parseISO(values.dueDate) : undefined}
                      onSelect={(d) => { if (d) { set("dueDate", format(d, "yyyy-MM-dd")); setDateOpen(false); } }} />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field label="Priority" icon={<Flag />} className="@xl/main:col-span-2">
                <ToggleGroup type="single" variant="chip" className="flex-wrap justify-start gap-2" aria-label="Priority"
                  value={values.priority} onValueChange={(v) => v && set("priority", v as Priority)}>
                  {PRIORITIES.map((p) => (
                    <ToggleGroupItem key={p} value={p} className="rounded-full">
                      <span className={cn("size-2 rounded-full", PRIORITY_DOT[p])} /> {PRIORITY_LABEL[p]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <Field label="Status" icon={<CircleDot />} className="@xl/main:col-span-2">
                <ToggleGroup type="single" variant="chip" className="flex-wrap justify-start gap-2" aria-label="Status"
                  value={values.status} onValueChange={(v) => v && set("status", v as Status)}>
                  {STATUSES.map((s) => (
                    <ToggleGroupItem key={s} value={s} className="rounded-full">{STATUS_LABEL[s]}</ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
            </CardContent>
            <CardFooter className="flex-col-reverse gap-3 border-t border-dashed bg-muted/40 pt-6 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { setValues(blank); setErrors({}); }}>
                <RotateCcw /> Reset
              </Button>
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                <Send /> Save task
              </Button>
            </CardFooter>
          </form>
        </Card>

        <aside className="@4xl/main:sticky @4xl/main:top-20">
          <div className="bg-hero overflow-hidden rounded-xl p-6 shadow-lift">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Live preview</div>
            <h3 className="mt-3 break-words font-display text-2xl font-extrabold">{values.title || "Your task title"}</h3>
            <p className="mt-2 min-h-10 text-sm text-ink-muted">
              {values.description || "A short description will appear here as you type."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant={values.status} className="bg-ink-foreground/90">{STATUS_LABEL[values.status]}</Badge>
              <Badge variant="outline" className="border-ink-foreground/25 text-ink-foreground">
                <span className={cn("size-2 rounded-full", PRIORITY_DOT[values.priority])} /> {PRIORITY_LABEL[values.priority]}
              </Badge>
            </div>
            <div className="mt-6 grid gap-2.5 text-sm [&_svg]:size-4 [&_svg]:text-ink-muted">
              <div className="flex items-center gap-2.5"><User /> {values.owner || "Unassigned"}</div>
              <div className="flex items-center gap-2.5"><CalendarDays /> {values.dueDate ? formatDate(values.dueDate) : "No due date yet"}</div>
            </div>
          </div>
          <p className="mt-4 flex gap-2 text-xs text-muted-foreground">
            <Lightbulb className="size-4 shrink-0" /> Open tasks that pass their due date show up as overdue on the dashboard.
          </p>
        </aside>
      </div>
    </div>
  );
}
