"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Columns3,
  CornerDownLeft,
  Inbox,
  RefreshCw,
  Search,
  Settings,
} from "lucide-react";
import { refreshCanvas } from "@/app/actions";
import { useToast } from "@/components/toast";
import { Dot } from "@/components/ui/pill";
import type { ShellCourse } from "@/components/app-shell";

interface Command {
  id: string;
  label: string;
  hint?: string;
  keywords: string;
  icon: React.ReactNode;
  run: () => void;
}

const COURSE_COLORS = ["#8b7cf6", "#4aa3df", "#2fbf9f", "#e2b53d", "#eb5757", "#a06bf5"];

// `g` then a letter jumps to a view (Linear-style). Kept next to the palette so
// the two keyboard entry points live together.
const GOTO: Record<string, string> = {
  d: "/",
  c: "/calendar",
  k: "/kanban",
  o: "/courses",
  s: "/settings",
};

export function CommandPalette({
  courses,
  open,
  onOpenChange,
}: {
  courses: ShellCourse[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => {
      router.push(href);
      onOpenChange(false);
    };
    return [
      { id: "nav-dash", label: "Go to Dashboard", hint: "G D", keywords: "dashboard home work", icon: <Inbox size={15} />, run: go("/") },
      { id: "nav-cal", label: "Go to Calendar", hint: "G C", keywords: "calendar month", icon: <Calendar size={15} />, run: go("/calendar") },
      { id: "nav-board", label: "Go to Board", hint: "G K", keywords: "board kanban lanes", icon: <Columns3 size={15} />, run: go("/kanban") },
      { id: "nav-courses", label: "Go to Courses", hint: "G O", keywords: "courses classes", icon: <BookOpen size={15} />, run: go("/courses") },
      { id: "nav-settings", label: "Go to Settings", hint: "G S", keywords: "settings token connection", icon: <Settings size={15} />, run: go("/settings") },
      {
        id: "act-refresh",
        label: "Refresh Canvas data",
        keywords: "refresh reload sync fetch",
        icon: <RefreshCw size={15} />,
        run: () => {
          onOpenChange(false);
          startTransition(async () => {
            await refreshCanvas();
            toast("Canvas data refreshed", "success");
          });
        },
      },
      ...courses.map<Command>((c, i) => ({
        id: `course-${c.id}`,
        label: c.name,
        hint: c.course_code,
        keywords: `${c.name} ${c.course_code} course`,
        icon: <Dot color={COURSE_COLORS[c.id % COURSE_COLORS.length]} className="h-2 w-2" />,
        run: go(`/courses/${c.id}`),
      })),
    ];
  }, [courses, router, onOpenChange, toast, startTransition]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((c) => `${c.label} ${c.keywords}`.toLowerCase().includes(needle));
  }, [q, commands]);

  // Global: ⌘K toggles the palette; `g <key>` jumps between views.
  useEffect(() => {
    let gPending = false;
    let timer: ReturnType<typeof setTimeout>;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
        return;
      }
      const el = e.target as HTMLElement;
      const typing = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "g") {
        gPending = true;
        clearTimeout(timer);
        timer = setTimeout(() => (gPending = false), 800);
        return;
      }
      if (gPending) {
        gPending = false;
        const to = GOTO[e.key.toLowerCase()];
        if (to) {
          e.preventDefault();
          router.push(to);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange, router]);

  // Reset + focus on open.
  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActive(0), [q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 pt-[15vh]"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="cm-row w-full max-w-lg overflow-hidden rounded-xl border border-line-strong bg-elevated shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
          <Search size={15} className="text-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                filtered[active]?.run();
              } else if (e.key === "Escape") {
                onOpenChange(false);
              }
            }}
            placeholder="Jump to a view, course, or action…"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-faint"
          />
          <kbd className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-faint">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-[13px] text-faint">No results.</p>
          )}
          {filtered.map((c, i) => (
            <button
              key={c.id}
              onMouseEnter={() => setActive(i)}
              onClick={c.run}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px]"
              style={{ background: i === active ? "var(--cm-accent-soft)" : undefined }}
            >
              <span className="grid w-4 place-items-center text-muted-foreground">{c.icon}</span>
              <span className="flex-1 truncate">{c.label}</span>
              {c.hint && (
                <span className="font-mono text-[10px] text-faint">{c.hint}</span>
              )}
              {i === active && <CornerDownLeft size={12} className="text-faint" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
