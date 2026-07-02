"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  Columns3,
  Inbox,
  PanelLeft,
  Plus,
  RefreshCw,
  Search,
  Settings,
} from "lucide-react";
import { refreshCanvas } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Dot } from "@/components/ui/pill";
import { ToastProvider } from "@/components/toast";
import { CommandPalette } from "@/components/command-palette";

export interface ShellCourse {
  id: number;
  name: string;
  course_code: string;
}

const NAV = [
  { href: "/", label: "Dashboard", icon: Inbox },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/kanban", label: "Board", icon: Columns3 },
  { href: "/courses", label: "Courses", icon: BookOpen },
];

// Stable per-course dot color (hash the id into the semantic palette).
const COURSE_COLORS = ["#8b7cf6", "#4aa3df", "#2fbf9f", "#e2b53d", "#eb5757", "#a06bf5"];
const courseColor = (id: number) => COURSE_COLORS[id % COURSE_COLORS.length];

const CRUMBS: { match: (p: string) => boolean; label: string }[] = [
  { match: (p) => p === "/", label: "Dashboard" },
  { match: (p) => p.startsWith("/calendar"), label: "Calendar" },
  { match: (p) => p.startsWith("/kanban"), label: "Board" },
  { match: (p) => p.startsWith("/courses"), label: "Courses" },
  { match: (p) => p.startsWith("/settings"), label: "Settings" },
  { match: (p) => p.startsWith("/debug"), label: "Debug" },
];

export function AppShell({
  courses,
  children,
}: {
  courses: ShellCourse[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = usePathname();
  const crumb = CRUMBS.find((c) => c.match(pathname))?.label ?? "canvas-monster";

  return (
    <ToastProvider>
    <CommandPalette courses={courses} open={paletteOpen} onOpenChange={setPaletteOpen} />
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      {/* mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 md:hidden",
          open ? "block" : "hidden",
        )}
        onClick={() => setOpen(false)}
      />

      {/* sidebar (animated width; overlays on mobile) */}
      <div
        className={cn(
          "z-50 shrink-0 overflow-hidden transition-[width] duration-200 ease-out",
          "max-md:fixed max-md:inset-y-0 max-md:left-0",
        )}
        style={{ width: open ? 236 : 0 }}
      >
        <Sidebar
          courses={courses}
          pathname={pathname}
          onCollapse={() => setOpen(false)}
          onSearch={() => setPaletteOpen(true)}
        />
      </div>

      {/* main */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center gap-3 border-b border-line px-4">
          <button
            onClick={() => setOpen((v) => !v)}
            title="Toggle sidebar"
            className={cn(
              "-ml-1 grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-elevated",
              open && "md:hidden",
            )}
          >
            <PanelLeft size={16} />
          </button>
          <span className="text-[13px] font-medium">{crumb}</span>

          <button
            onClick={() => setPaletteOpen(true)}
            title="Command palette"
            className="ml-auto flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[12px] text-muted-foreground hover:border-line-strong hover:text-foreground"
          >
            <Search size={13} />
            <kbd className="font-mono text-[10px] text-faint">⌘K</kbd>
          </button>

          <form action={refreshCanvas}>
            <button
              type="submit"
              title="Re-fetch all Canvas data now"
              className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[12px] text-muted-foreground hover:border-line-strong hover:text-foreground"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </form>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </main>
    </div>
    </ToastProvider>
  );
}

function Sidebar({
  courses,
  pathname,
  onCollapse,
  onSearch,
}: {
  courses: ShellCourse[];
  pathname: string;
  onCollapse: () => void;
  onSearch: () => void;
}) {
  return (
    <aside
      className="flex h-full w-[236px] flex-col border-r border-line text-[13px]"
      style={{ background: "var(--cm-sidebar)" }}
    >
      {/* workspace */}
      <div className="group/ws flex items-center gap-2 px-3 py-3">
        <div
          className="grid h-6 w-6 place-items-center rounded-md text-[11px] font-bold text-white"
          style={{ background: "linear-gradient(140deg,var(--cm-accent),#8b7cf6)" }}
        >
          C
        </div>
        <span className="font-medium">canvas</span>
        <ChevronDown size={14} className="text-faint" />
        <button
          onClick={onCollapse}
          title="Collapse sidebar"
          className="ml-auto grid h-6 w-6 place-items-center rounded-md text-faint opacity-0 transition-opacity hover:bg-elevated group-hover/ws:opacity-100"
        >
          <PanelLeft size={15} />
        </button>
      </div>

      {/* search — opens the command palette */}
      <div className="px-2 pb-2">
        <button
          onClick={onSearch}
          className="flex w-full items-center gap-2 rounded-md border border-line bg-panel px-2 py-1.5 text-left text-muted-foreground hover:border-line-strong"
        >
          <Search size={14} />
          <span className="flex-1">Search</span>
          <kbd className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-faint">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* primary nav */}
      <nav className="px-2">
        {NAV.map((n) => {
          const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "mb-0.5 flex items-center gap-2.5 rounded-md px-2 py-1.5",
                active ? "bg-accent-soft text-foreground" : "text-muted-foreground hover:bg-elevated",
              )}
            >
              <n.icon size={16} className={active ? "text-brand" : "text-faint"} />
              <span className="font-medium">{n.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* courses */}
      <div className="mt-4 flex items-center justify-between px-3 pb-1">
        <span className="text-[11px] font-medium tracking-wider text-faint uppercase">
          Courses
        </span>
        <Plus size={13} className="cursor-pointer text-faint" />
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2">
        {courses.length === 0 && (
          <p className="px-2 py-1.5 text-[12px] text-faint">No active courses</p>
        )}
        {courses.map((c) => {
          const active = pathname === `/courses/${c.id}`;
          return (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              title={c.name}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5",
                active ? "bg-accent-soft text-foreground" : "text-muted-foreground hover:bg-elevated",
              )}
            >
              <Dot color={courseColor(c.id)} className="h-2 w-2" />
              <span className="flex-1 truncate">{c.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* settings */}
      <div className="p-2">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2 py-1.5",
            pathname.startsWith("/settings")
              ? "bg-accent-soft text-foreground"
              : "text-muted-foreground hover:bg-elevated",
          )}
        >
          <Settings size={16} className="text-faint" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
