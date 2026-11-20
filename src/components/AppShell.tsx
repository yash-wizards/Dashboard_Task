import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ListChecks, Plus, PlusCircle, Zap } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useTasks } from "@/lib/tasks";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/new", label: "New task", icon: PlusCircle },
  { to: "/tasks", label: "All tasks", icon: ListChecks },
] as const;

function AppSidebar() {
  const tasks = useTasks();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setOpenMobile } = useSidebar();
  const open = tasks.filter((t) => t.status !== "done").length;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="grid size-9 shrink-0 -rotate-6 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Zap className="size-5" strokeWidth={2.6} />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate font-display text-xl font-extrabold leading-none">Pulseboard</div>
            <div className="mt-1 truncate text-xs text-ink-muted">Team task tracker</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-[0.14em] text-ink-muted">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV.map((item) => {
                const active = pathname === item.to;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      size="lg"
                      className="h-11 font-semibold text-ink-muted hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-glow"
                    >
                      <Link to={item.to} onClick={() => setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.to === "/tasks" && (
                      <SidebarMenuBadge className="top-3 rounded-full bg-sidebar-accent px-2 text-sidebar-foreground peer-data-[active=true]/menu-button:bg-ink/15 peer-data-[active=true]/menu-button:text-sidebar-primary-foreground">
                        {tasks.length}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:hidden">
        <div className="rounded-xl bg-sidebar-accent p-4 text-sm text-ink-muted">
          <div className="font-display text-base font-bold text-sidebar-foreground">
            {open} open {open === 1 ? "task" : "tasks"}
          </div>
          Keep the momentum going — close one today.
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = NAV.find((n) => n.to === pathname)?.label ?? "Pulseboard";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-dots min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-md sm:px-5">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <span className="min-w-0 truncate text-sm font-semibold text-muted-foreground">{current}</span>
          {pathname !== "/new" && (
            <Button asChild size="sm" className="ml-auto h-9 shadow-none sm:hidden">
              <Link to="/new" aria-label="New task"><Plus /> New</Link>
            </Button>
          )}
        </header>
        <div className="@container/main flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-highlight">{eyebrow}</div>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">{description}</p>
      </div>
      {action && <div className="hidden shrink-0 sm:block">{action}</div>}
    </header>
  );
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
