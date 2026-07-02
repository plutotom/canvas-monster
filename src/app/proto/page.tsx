"use client";

// Isolated Linear-style design prototype. Dummy data only — no Canvas, no DB.
// Renders as a fixed full-screen overlay so the global nav doesn't interfere.
// Throwaway taste-test for the redesign; delete or fold into the real plan.

import { useState } from "react";
import {
  Box,
  Calendar,
  ChevronDown,
  ChevronRight,
  Columns3,
  Filter,
  Inbox,
  LayoutList,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Search,
  Settings,
} from "lucide-react";

// --- palette (scoped inline so we don't touch global tokens yet) ---
const C = {
  sidebar: "#0f1113", // sidebar chrome (a hair darker than content)
  bg: "#131416", // content area
  panel: "#0e0f11",
  elev: "#1a1b1e", // hover
  column: "#17181b", // board column surface (subtly lifted from page bg)
  card: "#1c1d20", // board card surface
  band: "rgba(255,255,255,0.025)", // group header band
  border: "rgba(255,255,255,0.06)",
  borderStrong: "rgba(255,255,255,0.10)",
  text: "#eceef1",
  muted: "#8a8f98",
  faint: "#6b7079",
  accent: "#5e6ad2",
  accentSoft: "rgba(94,106,210,0.12)",
};

type Status = "todo" | "progress" | "done";
type Row = {
  id: string;
  title: string;
  parent?: string;
  status: Status;
  priority: 0 | 1 | 2 | 3; // 0 none, 1 low, 2 med, 3 high
  progress?: [number, number];
  labels: { name: string; color: string }[];
  course: string;
  assignee?: string; // initials
  due: string;
  group: "Overdue" | "This week" | "Later";
};

const L = {
  reading: { name: "Reading", color: "#4aa3df" },
  paper: { name: "Paper", color: "#a06bf5" },
  exam: { name: "Exam", color: "#eb5757" },
  video: { name: "Video", color: "#e2b53d" },
  todo: { name: "Todo", color: "#4cb782" },
  discussion: { name: "Discussion", color: "#4cb782" },
};

const ROWS: Row[] = [
  { id: "CM-142", title: "Read Bowen ch. 4 — differentiation of self", status: "progress", priority: 3, progress: [2, 3], labels: [L.reading], course: "PSYC-738", assignee: "IP", due: "Jun 30", group: "Overdue" },
  { id: "CM-139", title: "Response paper: family systems case study", status: "todo", priority: 3, labels: [L.paper], course: "PSYC-738", assignee: "IP", due: "Jul 1", group: "Overdue" },
  { id: "CM-155", title: "Watch lecture: Trinity & personhood", status: "todo", priority: 2, labels: [L.video], course: "THEO-501", due: "Wed", group: "This week" },
  { id: "CM-158", title: "Exegesis draft — Romans 8:1–17", parent: "Final exegetical paper", status: "progress", priority: 3, progress: [1, 4], labels: [L.paper], course: "BIBL-612", assignee: "IP", due: "Thu", group: "This week" },
  { id: "CM-160", title: "Discussion post: imago Dei readings", status: "todo", priority: 0, labels: [L.discussion, L.todo], course: "THEO-501", due: "Fri", group: "This week" },
  { id: "CM-171", title: "Midterm exam — pastoral counseling", status: "todo", priority: 3, labels: [L.exam], course: "PSYC-738", due: "Jul 21", group: "Later" },
  { id: "CM-176", title: "Read Wright — Paul and the faithfulness of God", status: "todo", priority: 1, labels: [L.reading], course: "BIBL-612", due: "Jul 24", group: "Later" },
];

const GROUPS = [
  { id: "Overdue", color: "#eb5757", status: "todo" as Status },
  { id: "This week", color: "#e2b53d", status: "progress" as Status },
  { id: "Later", color: C.faint, status: "todo" as Status },
];

const NAV = [
  { icon: Inbox, label: "Dashboard", count: 7, active: true },
  { icon: Calendar, label: "Calendar" },
  { icon: Columns3, label: "Board" },
];

const COURSES = [
  { code: "PSYC-738", name: "Family Theory & Therapy", color: "#8b7cf6" },
  { code: "THEO-501", name: "Systematic Theology I", color: "#4aa3df" },
  { code: "BIBL-612", name: "Romans Exegesis", color: "#2fbf9f" },
];

export default function Proto() {
  const [view, setView] = useState<"list" | "board">("list");
  const [sel, setSel] = useState<Set<string>>(new Set(["CM-139"]));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Multi-select: plain click toggles membership; Escape / Clear empties it.
  function toggle(id: string) {
    setSel((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex text-[13px]"
      style={{ background: C.bg, color: C.text, fontFamily: "var(--font-geist-sans)" }}
    >
      <style>{`
        @keyframes protoUp { from { opacity:0; transform:translateY(3px) } to { opacity:1; transform:none } }
        .proto-row { animation: protoUp .26s cubic-bezier(.2,.7,.3,1) both }
        .proto-hover:hover { background: ${C.elev} !important }
        .proto-r:hover { background: ${C.elev} }
        .proto-card:hover { background: #24252a !important; border-color: ${C.borderStrong} !important }
        .proto-ghost:hover { background: ${C.band} !important; color: ${C.muted} !important }
      `}</style>

      {/* ---------------- Sidebar ---------------- */}
      <div
        className="shrink-0 overflow-hidden transition-[width] duration-200 ease-out"
        style={{ width: sidebarOpen ? 236 : 0 }}
      >
        <aside
          className="flex h-full w-[236px] flex-col"
          style={{ background: C.sidebar, borderRight: `1px solid ${C.border}` }}
        >
          <div className="group/ws flex items-center gap-2 px-3 py-3">
            <div
              className="grid h-6 w-6 place-items-center rounded-md text-[11px] font-bold text-white"
              style={{ background: `linear-gradient(140deg,${C.accent},#8b7cf6)` }}
            >
              C
            </div>
            <span className="font-medium">canvas</span>
            <ChevronDown size={14} style={{ color: C.faint }} />
            <button
              onClick={() => setSidebarOpen(false)}
              title="Collapse sidebar"
              className="proto-hover ml-auto grid h-6 w-6 place-items-center rounded-md opacity-0 transition-opacity group-hover/ws:opacity-100"
              style={{ color: C.faint }}
            >
              <PanelLeft size={15} />
            </button>
          </div>

        <div className="px-2 pb-2">
          <button
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left"
            style={{ background: C.panel, color: C.muted, border: `1px solid ${C.border}` }}
          >
            <Search size={14} />
            <span className="flex-1">Search</span>
            <kbd
              className="rounded px-1.5 py-0.5 text-[10px]"
              style={{ background: C.bg, color: C.faint, fontFamily: "var(--font-geist-mono)" }}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        <nav className="px-2">
          {NAV.map((n) => (
            <a
              key={n.label}
              className="proto-hover mb-0.5 flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5"
              style={{
                background: n.active ? C.accentSoft : "transparent",
                color: n.active ? C.text : C.muted,
              }}
            >
              <n.icon size={16} style={{ color: n.active ? C.accent : C.faint }} />
              <span className="flex-1 font-medium">{n.label}</span>
              {n.count && (
                <span className="text-[11px]" style={{ color: C.faint }}>
                  {n.count}
                </span>
              )}
            </a>
          ))}
        </nav>

        <div className="mt-4 flex items-center justify-between px-3 pb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: C.faint }}>
            Courses
          </span>
          <Plus size={13} style={{ color: C.faint }} className="cursor-pointer" />
        </div>
        <nav className="px-2">
          {COURSES.map((c) => (
            <a
              key={c.code}
              className="proto-hover flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5"
              style={{ color: C.muted }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
              <span className="flex-1 truncate">{c.name}</span>
            </a>
          ))}
        </nav>

          <div className="mt-auto p-2">
            <a
              className="proto-hover flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5"
              style={{ color: C.muted }}
            >
              <Settings size={16} style={{ color: C.faint }} />
              <span>Settings</span>
            </a>
          </div>
        </aside>
      </div>

      {/* ---------------- Main ---------------- */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-11 shrink-0 items-center gap-3 px-4"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              title="Open sidebar"
              className="proto-hover -ml-1 grid h-7 w-7 place-items-center rounded-md"
              style={{ color: C.muted }}
            >
              <PanelLeft size={16} />
            </button>
          )}
          <span className="font-medium">Dashboard</span>
          <span style={{ color: C.faint }}>/</span>
          <span style={{ color: C.muted }}>My Work</span>

          <div className="ml-auto flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 rounded-md px-2 py-1"
              style={{ color: C.muted, border: `1px solid ${C.border}` }}
            >
              <Filter size={13} /> Filter
            </button>
            <div className="flex items-center rounded-md p-0.5" style={{ border: `1px solid ${C.border}` }}>
              <Seg icon={LayoutList} active={view === "list"} onClick={() => setView("list")} />
              <Seg icon={Columns3} active={view === "board"} onClick={() => setView("board")} />
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          {view === "list" ? (
            <div className="pb-16">
              {GROUPS.map((g) => {
                const rows = ROWS.filter((r) => r.group === g.id);
                const isCol = collapsed[g.id];
                return (
                  <section key={g.id}>
                    {/* group header */}
                    <div className="sticky top-0 z-10 py-1" style={{ background: C.bg }}>
                      <div
                        className="mx-2 flex items-center gap-1.5 rounded-md px-2 py-1.5"
                        style={{ background: C.band }}
                      >
                        <button
                          onClick={() => setCollapsed((s) => ({ ...s, [g.id]: !s[g.id] }))}
                          className="grid place-items-center"
                          style={{ color: C.faint }}
                        >
                          {isCol ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                        </button>
                        <StatusIcon status={g.status} color={g.color} />
                        <span className="font-medium" style={{ color: C.text }}>
                          {g.id}
                        </span>
                        <span style={{ color: C.faint }}>{rows.length}</span>
                        <Plus size={14} className="ml-auto cursor-pointer" style={{ color: C.faint }} />
                      </div>
                    </div>
                    {!isCol &&
                      rows.map((r, i) => (
                        <RowItem key={r.id} r={r} i={i} selected={sel.has(r.id)} onClick={() => toggle(r.id)} />
                      ))}
                  </section>
                );
              })}
            </div>
          ) : (
            <Board />
          )}
        </div>

        {/* bulk-action bar — appears when items are selected */}
        {sel.size > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
            <div
              className="proto-row pointer-events-auto flex items-center gap-1 rounded-xl p-1 pl-3 shadow-2xl"
              style={{ background: C.elev, border: `1px solid ${C.borderStrong}` }}
            >
              <span className="pr-2 text-[12px]" style={{ color: C.muted }}>
                <b style={{ color: C.text }}>{sel.size}</b> selected
              </span>
              <BulkBtn icon={StatusDoneMini} label="Mark done" />
              <BulkBtn icon={Columns3} label="Move lane" />
              <BulkBtn icon={Calendar} label="Reschedule" />
              <button
                onClick={() => setSel(new Set())}
                className="ml-1 rounded-lg px-2 py-1.5 text-[12px]"
                style={{ color: C.faint }}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function BulkBtn({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
}) {
  return (
    <button
      className="proto-hover flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px]"
      style={{ color: C.text }}
    >
      <Icon size={14} style={{ color: C.muted }} />
      {label}
    </button>
  );
}

function StatusDoneMini({ size = 14 }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6.5" fill="#4cb782" />
      <path d="M5 8 l2 2 l4-4.2" fill="none" stroke={C.elev} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Seg({ icon: Icon, active, onClick }: { icon: typeof LayoutList; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid h-6 w-7 place-items-center rounded"
      style={{ background: active ? C.elev : "transparent", color: active ? C.text : C.faint }}
    >
      <Icon size={14} />
    </button>
  );
}

// Linear-style signal-bar priority icon (three bars, N filled by level).
function PriorityIcon({ level }: { level: 0 | 1 | 2 | 3 }) {
  if (level === 0)
    return <MoreHorizontal size={15} style={{ color: C.faint }} />;
  const heights = [4, 7, 10];
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" className="shrink-0">
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * 5 + 1}
          y={11 - h}
          width="3"
          height={h}
          rx="1"
          fill={i < level ? C.muted : "rgba(255,255,255,0.14)"}
        />
      ))}
    </svg>
  );
}

// Linear-style status circle: empty / half / check.
function StatusIcon({ status, color }: { status: Status; color?: string }) {
  const stroke = color ?? (status === "done" ? "#4cb782" : status === "progress" ? "#e2b53d" : C.faint);
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" className="shrink-0">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke={stroke} strokeWidth="1.5" />
      {status === "progress" && (
        <path d="M8 8 L8 2 A6 6 0 0 1 8 14 Z" fill={stroke} />
      )}
      {status === "done" && (
        <>
          <circle cx="8" cy="8" r="6.5" fill={stroke} />
          <path d="M5 8 l2 2 l4-4.2" fill="none" stroke="#0e0f11" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-[3px] text-[11.5px]"
      style={{ border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)", color: C.muted }}
    >
      {children}
    </span>
  );
}

function RowItem({ r, i, selected, onClick }: { r: Row; i: number; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="proto-row proto-r group mx-2 flex cursor-pointer items-center gap-2.5 rounded-lg py-[7px] pr-3 pl-7"
      style={{
        background: selected ? C.accentSoft : undefined,
        boxShadow: selected ? `inset 0 0 0 1px ${C.accent}55` : undefined,
        animationDelay: `${i * 26}ms`,
      }}
    >
      <PriorityIcon level={r.priority} />
      <span className="w-[52px] shrink-0 text-[12px]" style={{ color: C.faint, fontFamily: "var(--font-geist-mono)" }}>
        {r.id}
      </span>
      <StatusIcon status={r.status} />
      <span className="truncate font-medium" style={{ color: C.text }}>
        {r.title}
      </span>
      {r.parent && (
        <span className="hidden min-w-0 items-center gap-1.5 lg:flex" style={{ color: C.faint }}>
          <ChevronRight size={12} />
          <span className="truncate">{r.parent}</span>
        </span>
      )}
      {r.progress && (
        <Pill>
          <ProgressRing done={r.progress[0]} total={r.progress[1]} />
          {r.progress[0]}/{r.progress[1]}
        </Pill>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
        <div className="hidden items-center gap-1.5 md:flex">
          {r.labels.map((l) => (
            <Pill key={l.name}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />
              {l.name}
            </Pill>
          ))}
        </div>
        <span className="hidden sm:block">
          <Pill>
            <Box size={12} style={{ color: C.muted }} />
            {r.course}
          </Pill>
        </span>
        <Avatar initials={r.assignee} />
        <span className="w-11 shrink-0 text-right text-[12px]" style={{ color: C.muted }}>
          {r.due}
        </span>
      </div>
    </div>
  );
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const frac = total ? done / total : 0;
  const r = 5;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="13" height="13" viewBox="0 0 14 14">
      <circle cx="7" cy="7" r={r} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
      <circle
        cx="7"
        cy="7"
        r={r}
        fill="none"
        stroke={C.accent}
        strokeWidth="2"
        strokeDasharray={`${circ * frac} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 7 7)"
      />
    </svg>
  );
}

function Avatar({ initials }: { initials?: string }) {
  if (!initials)
    return (
      <span
        className="grid h-[18px] w-[18px] place-items-center rounded-full border border-dashed text-[9px]"
        style={{ borderColor: C.borderStrong, color: C.faint }}
      >
        ?
      </span>
    );
  return (
    <span
      className="grid h-[18px] w-[18px] place-items-center rounded-full text-[9px] font-semibold text-white"
      style={{ background: "linear-gradient(140deg,#6b7bd6,#a06bf5)" }}
    >
      {initials}
    </span>
  );
}

function Board() {
  const lanes: { id: string; label: string; status: Status }[] = [
    { id: "read", label: "To Read", status: "todo" },
    { id: "watch", label: "Watch", status: "todo" },
    { id: "do", label: "Do", status: "progress" },
    { id: "done", label: "Done", status: "done" },
  ];
  const byLane: Record<string, Row[]> = {
    read: ROWS.filter((r) => r.labels[0]?.name === "Reading"),
    watch: ROWS.filter((r) => r.labels[0]?.name === "Video"),
    do: ROWS.filter((r) => ["Paper", "Exam", "Discussion"].includes(r.labels[0]?.name)),
    done: [],
  };
  return (
    <div className="flex h-full gap-2 overflow-x-auto px-3 py-2">
      {lanes.map((l) => (
        <div
          key={l.id}
          className="group flex w-[300px] shrink-0 flex-col rounded-xl"
          style={{ background: C.column }}
        >
          {/* column header — borderless, actions on right */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <StatusIcon status={l.status} color={l.status === "todo" ? C.faint : undefined} />
            <span className="font-medium">{l.label}</span>
            <span style={{ color: C.faint }}>{byLane[l.id].length}</span>
            <div className="ml-auto flex items-center gap-1" style={{ color: C.faint }}>
              <MoreHorizontal size={15} className="cursor-pointer" />
              <Plus size={15} className="cursor-pointer" />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
            {byLane[l.id].map((r, i) => (
              <BoardCard key={r.id} r={r} i={i} />
            ))}
            <button
              className="proto-ghost flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: C.faint, border: `1px solid ${C.border}` }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function BoardCard({ r, i }: { r: Row; i: number }) {
  return (
    <div
      className="proto-row proto-card flex cursor-pointer flex-col gap-2 rounded-lg p-3"
      style={{ background: C.card, border: `1px solid ${C.border}`, animationDelay: `${i * 40}ms`, transition: "background .1s, border-color .1s" }}
    >
      {/* id + assignee */}
      <div className="flex items-center gap-2">
        <span className="text-[12px]" style={{ color: C.faint, fontFamily: "var(--font-geist-mono)" }}>
          {r.id}
        </span>
        {r.parent && (
          <span className="flex min-w-0 items-center gap-1" style={{ color: C.faint }}>
            <ChevronRight size={11} />
            <span className="truncate text-[12px]">{r.parent}</span>
          </span>
        )}
        <span className="ml-auto">
          <Avatar initials={r.assignee} />
        </span>
      </div>

      {/* status + title */}
      <div className="flex items-start gap-2">
        <span className="mt-[2px]">
          <StatusIcon status={r.status} />
        </span>
        <span className="font-medium leading-snug" style={{ color: C.text }}>
          {r.title}
        </span>
      </div>

      {/* meta */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="grid h-[22px] w-[22px] place-items-center">
          <PriorityIcon level={r.priority} />
        </span>
        <Pill>
          <Box size={12} style={{ color: C.muted }} />
          {r.course}
        </Pill>
        {r.labels.map((l) => (
          <Pill key={l.name}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />
            {l.name}
          </Pill>
        ))}
        {r.progress && (
          <Pill>
            <ProgressRing done={r.progress[0]} total={r.progress[1]} />
            {r.progress[0]}/{r.progress[1]}
          </Pill>
        )}
      </div>

      {/* footer */}
      <div className="text-[11.5px]" style={{ color: C.faint }}>
        Due {r.due}
      </div>
    </div>
  );
}
