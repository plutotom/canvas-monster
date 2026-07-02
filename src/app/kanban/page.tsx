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
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between gap-4 px-4 pt-3 pb-1">
        <h1 className="text-[15px] font-semibold">Board</h1>
        <p className="text-[12px] text-faint">
          Module items across all courses. Drag or use the menu to move.
        </p>
      </div>

      {!dbEnabled && (
        <div
          className="mx-3 mb-1 rounded-lg border p-3 text-[13px]"
          style={{
            borderColor:
              "color-mix(in oklch, var(--cm-amber), transparent 60%)",
            background: "color-mix(in oklch, var(--cm-amber), transparent 90%)",
            color: "color-mix(in oklch, var(--cm-amber), white 45%)",
          }}
        >
          <span className="font-medium">No database connected — </span>
          lanes show their auto-computed position but moves won&apos;t persist.
          Set <code>DATABASE_URL</code> in <code>.env.local</code> and run{" "}
          <code>pnpm db:push</code>.
        </div>
      )}

      {error ? (
        <div className="px-4 py-4">
          <ErrorBox error={error} />
        </div>
      ) : cards && cards.length === 0 ? (
        <p className="px-4 py-6 text-muted-foreground">
          No module items found in your active courses.
        </p>
      ) : (
        <div className="min-h-0 flex-1">
          <Board cards={cards ?? []} persists={dbEnabled} />
        </div>
      )}
    </div>
  );
}
