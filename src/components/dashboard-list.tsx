"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { UpcomingItem } from "@/lib/canvas/dashboard";
import {
  BUCKET_ORDER,
  bucketFor,
  formatShort,
  priorityForBucket,
  type Bucket,
} from "@/lib/dates";
import { PriorityIcon } from "@/components/ui/priority-icon";
import { StatusIcon } from "@/components/ui/status-icon";
import { Pill } from "@/components/ui/pill";
import { Box } from "lucide-react";

const BUCKET_COLOR: Record<Bucket, string | undefined> = {
  Overdue: "var(--cm-red)",
  Today: "var(--cm-amber)",
  Tomorrow: "var(--cm-green)",
  "This week": "var(--cm-blue)",
  Later: undefined,
};

export function DashboardList({
  items,
  generatedAt,
}: {
  items: UpcomingItem[];
  generatedAt: string;
}) {
  const now = new Date(generatedAt);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggle(id: number) {
    setSel((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function openSelected() {
    items
      .filter((i) => sel.has(i.assignmentId))
      .forEach((i) => window.open(i.htmlUrl, "_blank", "noopener"));
  }

  return (
    <>
      <div className="pb-24">
        {BUCKET_ORDER.map((bucket) => {
          const rows = items.filter((i) => bucketFor(i.dueAt, now) === bucket);
          if (rows.length === 0) return null;
          const isCol = collapsed[bucket];
          return (
            <section key={bucket}>
              <div className="sticky top-0 z-10 bg-background py-1">
                <div className="mx-2 flex items-center gap-1.5 rounded-md bg-band px-2 py-1.5">
                  <button
                    onClick={() => setCollapsed((s) => ({ ...s, [bucket]: !s[bucket] }))}
                    className="grid place-items-center text-faint"
                  >
                    {isCol ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <StatusIcon status="todo" color={BUCKET_COLOR[bucket]} />
                  <span className="font-medium">{bucket}</span>
                  <span className="text-faint">{rows.length}</span>
                </div>
              </div>
              {!isCol &&
                rows.map((item, i) => (
                  <Row
                    key={item.assignmentId}
                    item={item}
                    i={i}
                    selected={sel.has(item.assignmentId)}
                    onClick={() => toggle(item.assignmentId)}
                  />
                ))}
            </section>
          );
        })}
      </div>

      {sel.size > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center">
          <div className="cm-row pointer-events-auto flex items-center gap-1 rounded-xl border border-line-strong bg-elevated p-1 pl-3 shadow-2xl">
            <span className="pr-2 text-[12px] text-muted-foreground">
              <b className="text-foreground">{sel.size}</b> selected
            </span>
            <button
              onClick={openSelected}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] hover:bg-column"
            >
              <ExternalLink size={14} className="text-muted-foreground" />
              Open in Canvas
            </button>
            <button
              onClick={() => setSel(new Set())}
              className="ml-1 rounded-lg px-2 py-1.5 text-[12px] text-faint"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Row({
  item,
  i,
  selected,
  onClick,
}: {
  item: UpcomingItem;
  i: number;
  selected: boolean;
  onClick: () => void;
}) {
  const bucket = bucketFor(item.dueAt);
  return (
    <div
      onClick={onClick}
      className="cm-row group mx-2 flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg py-[7px] pr-3 pl-7 hover:bg-elevated aria-selected:bg-accent-soft"
      aria-selected={selected}
      style={{
        boxShadow: selected ? "inset 0 0 0 1px color-mix(in oklch, var(--cm-accent), transparent 66%)" : undefined,
        animationDelay: `${i * 26}ms`,
      }}
    >
      <PriorityIcon level={priorityForBucket(bucket)} />
      <StatusIcon status={item.submitted ? "done" : "todo"} />
      <span className="min-w-0 flex-1 truncate font-medium" title={item.name}>
        {item.name}
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
        {item.missing && (
          <Pill className="!text-cm-red">
            <span className="h-1.5 w-1.5 rounded-full bg-cm-red" />
            missing
          </Pill>
        )}
        {item.pointsPossible != null && (
          <span className="hidden text-[12px] text-faint md:block">
            {item.pointsPossible} pts
          </span>
        )}
        <span className="hidden sm:block">
          <Pill>
            <Box size={12} className="text-muted-foreground" />
            {item.courseCode}
          </Pill>
        </span>
        <span className="w-11 shrink-0 text-right text-[12px] text-muted-foreground">
          {formatShort(item.dueAt)}
        </span>
      </div>
    </div>
  );
}
