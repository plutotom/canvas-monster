"use client";

import { useState, useTransition } from "react";
import { Box, MoreHorizontal, Plus } from "lucide-react";
import { LANES, type KanbanCard, type Lane } from "@/lib/kanban";
import { moveItem } from "./actions";
import { StatusIcon, type Status } from "@/components/ui/status-icon";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/toast";

// Lane → the status circle shown in its column header.
const LANE_STATUS: Record<Lane, Status> = {
  read: "todo",
  watch: "todo",
  do: "progress",
  done: "done",
};

export function Board({
  cards: initial,
  persists,
}: {
  cards: KanbanCard[];
  persists: boolean;
}) {
  const [cards, setCards] = useState(initial);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overLane, setOverLane] = useState<Lane | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const toast = useToast();

  function move(itemKey: string, lane: Lane) {
    const card = cards.find((c) => c.itemKey === itemKey);
    if (!card || card.lane === lane) return;
    const label = LANES.find((l) => l.id === lane)?.label ?? lane;

    const prev = cards;
    setCards((cs) =>
      cs.map((c) => (c.itemKey === itemKey ? { ...c, lane, manual: true } : c)),
    );
    setError(null);

    if (!persists) return; // no DB — local-only
    startTransition(async () => {
      try {
        await moveItem(itemKey, lane);
        toast(`Moved to ${label}`, "success");
      } catch (e) {
        setCards(prev);
        const msg = e instanceof Error ? e.message : "Failed to move item.";
        setError(msg);
        toast(msg, "error");
      }
    });
  }

  return (
    <>
      {error && (
        <p
          className="mx-3 mt-2 rounded-md border px-3 py-2 text-xs"
          style={{
            borderColor: "color-mix(in oklch, var(--cm-red), transparent 60%)",
            background: "color-mix(in oklch, var(--cm-red), transparent 88%)",
            color: "color-mix(in oklch, var(--cm-red), white 55%)",
          }}
        >
          {error}
        </p>
      )}
      <div className="flex h-full gap-2 overflow-x-auto px-3 py-2">
        {LANES.map((lane) => {
          const laneCards = cards.filter((c) => c.lane === lane.id);
          return (
            <div
              key={lane.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOverLane(lane.id);
              }}
              onDragLeave={() => setOverLane((l) => (l === lane.id ? null : l))}
              onDrop={(e) => {
                e.preventDefault();
                setOverLane(null);
                if (dragKey) move(dragKey, lane.id);
                setDragKey(null);
              }}
              className="group flex w-[300px] shrink-0 flex-col rounded-xl transition-colors"
              style={{
                background:
                  overLane === lane.id
                    ? "var(--cm-accent-soft)"
                    : "var(--cm-column)",
              }}
            >
              <div className="flex items-center gap-2 px-3 py-2.5">
                <StatusIcon
                  status={LANE_STATUS[lane.id]}
                  color={
                    LANE_STATUS[lane.id] === "todo"
                      ? "var(--cm-faint)"
                      : undefined
                  }
                />
                <span className="text-[13px] font-medium">{lane.label}</span>
                <span className="text-faint">{laneCards.length}</span>
                <div className="ml-auto flex items-center gap-1 text-faint">
                  <MoreHorizontal size={15} className="cursor-pointer" />
                  <Plus size={15} className="cursor-pointer" />
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                {laneCards.map((card, i) => (
                  <Card
                    key={card.itemKey}
                    card={card}
                    i={i}
                    onDragStart={() => setDragKey(card.itemKey)}
                    onMove={(l) => move(card.itemKey, l)}
                  />
                ))}
                {laneCards.length === 0 && (
                  <p className="py-8 text-center text-[11px] text-faint">
                    Empty
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Card({
  card,
  i,
  onDragStart,
  onMove,
}: {
  card: KanbanCard;
  i: number;
  onDragStart: () => void;
  onMove: (lane: Lane) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cm-row flex min-w-0 cursor-grab flex-col gap-2 rounded-lg border border-line bg-card p-3 transition-colors hover:border-line-strong active:cursor-grabbing"
      style={{ animationDelay: `${i * 40}ms` }}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-faint">{card.type}</span>
        {card.submitted && (
          <span className="text-[11px]" style={{ color: "var(--cm-green)" }}>
            submitted
          </span>
        )}
      </div>

      <a
        href={card.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title={card.title}
        className="line-clamp-2 text-[13px] leading-snug font-medium hover:text-brand"
      >
        {card.title}
      </a>

      <div className="flex flex-wrap items-center gap-1.5">
        <Pill>
          <Box size={12} className="text-muted-foreground" />
          {card.courseCode}
        </Pill>
      </div>

      {/* touch-friendly lane picker (native DnD is unreliable on mobile) */}
      <select
        value={card.lane}
        onChange={(e) => onMove(e.target.value as Lane)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Move to lane"
        className="mt-0.5 w-full rounded-md border border-line bg-panel px-2 py-1 text-[12px] text-muted-foreground"
      >
        {LANES.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
