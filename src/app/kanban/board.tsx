"use client";

import { useState, useTransition } from "react";
import { LANES, type KanbanCard, type Lane } from "@/lib/kanban";
import { moveItem } from "./actions";

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

  function move(itemKey: string, lane: Lane) {
    const card = cards.find((c) => c.itemKey === itemKey);
    if (!card || card.lane === lane) return;

    const prev = cards;
    // optimistic
    setCards((cs) =>
      cs.map((c) =>
        c.itemKey === itemKey ? { ...c, lane, manual: true } : c,
      ),
    );
    setError(null);

    if (!persists) return; // no DB — local-only, don't call the action
    startTransition(async () => {
      try {
        await moveItem(itemKey, lane);
      } catch (e) {
        setCards(prev); // roll back
        setError(e instanceof Error ? e.message : "Failed to move item.");
      }
    });
  }

  return (
    <>
      {error && (
        <p className="mb-4 rounded border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LANES.map((lane) => {
          const laneCards = cards.filter((c) => c.lane === lane.id);
          return (
            <section
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
              className={`flex flex-col rounded-xl border p-3 transition-colors ${
                overLane === lane.id
                  ? "border-emerald-700 bg-emerald-950/20"
                  : "border-zinc-800 bg-zinc-900/40"
              }`}
            >
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-zinc-200">
                  {lane.label}
                </h2>
                <span className="text-xs text-zinc-500">{laneCards.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {laneCards.map((card) => (
                  <Card
                    key={card.itemKey}
                    card={card}
                    onDragStart={() => setDragKey(card.itemKey)}
                    onMove={(lane) => move(card.itemKey, lane)}
                  />
                ))}
                {laneCards.length === 0 && (
                  <p className="py-6 text-center text-xs text-zinc-600">
                    Empty
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function Card({
  card,
  onDragStart,
  onMove,
}: {
  card: KanbanCard;
  onDragStart: () => void;
  onMove: (lane: Lane) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 active:cursor-grabbing"
    >
      <a
        href={card.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-sm font-medium text-zinc-100 hover:text-emerald-300"
      >
        {card.title}
      </a>
      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
        <span>{card.courseCode}</span>
        <span>·</span>
        <span>{card.type}</span>
        {card.submitted && <span className="text-emerald-500">· submitted</span>}
      </div>
      {/* touch-friendly lane picker (native DnD is unreliable on mobile) */}
      <select
        value={card.lane}
        onChange={(e) => onMove(e.target.value as Lane)}
        aria-label="Move to lane"
        className="mt-2 w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
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
