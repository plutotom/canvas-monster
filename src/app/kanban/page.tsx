import { buildBoard } from "@/lib/kanban-build";
import type { KanbanCard } from "@/lib/kanban";
import { dbEnabled } from "@/lib/db/client";
import { ErrorBox, toLoadError, type LoadError } from "@/components/error-box";
import { Board } from "./board";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  let cards: KanbanCard[] | undefined;
  let error: LoadError | null = null;
  try {
    cards = await buildBoard();
  } catch (err) {
    error = toLoadError(err, !!process.env.CANVAS_TOKEN);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-100">Kanban</h1>
        <p className="text-xs text-zinc-500">
          Module items across all courses. Drag or use the menu to move.
        </p>
      </div>

      {!dbEnabled && (
        <div className="mb-6 rounded-lg border border-amber-900/60 bg-amber-950/30 p-4 text-sm text-amber-200">
          <p className="font-medium">No database connected</p>
          <p className="mt-1 text-amber-200/80">
            Lanes show their auto-computed position but moves won&apos;t persist.
            Set <code>DATABASE_URL</code> in <code>.env.local</code> and run{" "}
            <code>pnpm db:push</code>.
          </p>
        </div>
      )}

      {error ? (
        <ErrorBox error={error} />
      ) : cards && cards.length === 0 ? (
        <p className="text-zinc-400">
          No module items found in your active courses.
        </p>
      ) : (
        <Board cards={cards ?? []} persists={dbEnabled} />
      )}
    </main>
  );
}
