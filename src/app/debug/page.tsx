import { getActiveCourses, getTodo, CanvasError } from "@/lib/canvas/client";
import type { CanvasCourse, CanvasTodoItem } from "@/lib/canvas/types";

export const dynamic = "force-dynamic";

// Plain server-rendered debug view: proves real Canvas data flows end-to-end
// through the server-only client. No styling beyond monospace JSON dumps.

type LoadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

async function load<T>(fn: () => Promise<T>): Promise<LoadResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof CanvasError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function Section<T>({
  title,
  result,
}: {
  title: string;
  result: LoadResult<T>;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {result.ok ? (
        <pre className="overflow-x-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-100">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      ) : (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">
            Error{result.status ? ` (${result.status})` : ""}
          </p>
          <p className="mt-1 font-mono text-xs">{result.error}</p>
          {!process.env.CANVAS_TOKEN && (
            <p className="mt-2">
              Tip: set <code>CANVAS_TOKEN</code> in <code>.env.local</code> and
              restart the dev server.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default async function DebugPage() {
  const [courses, todo] = await Promise.all([
    load<CanvasCourse[]>(getActiveCourses),
    load<CanvasTodoItem[]>(getTodo),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <header>
        <h1 className="text-2xl font-bold">canvas-monster · debug</h1>
        <p className="text-sm text-zinc-500">
          Raw Canvas API responses. If these load, the server-side client and
          token are wired correctly.
        </p>
      </header>
      <Section title="Active courses" result={courses} />
      <Section title="To-do" result={todo} />
    </main>
  );
}
