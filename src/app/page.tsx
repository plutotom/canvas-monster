import Link from "next/link";
import {
  getDashboard,
  type DashboardData,
  type UpcomingItem,
} from "@/lib/canvas/dashboard";
import { CanvasError } from "@/lib/canvas/client";
import { BUCKET_ORDER, bucketFor, formatDue, type Bucket } from "@/lib/dates";

export const dynamic = "force-dynamic";

const BUCKET_ACCENT: Record<Bucket, string> = {
  Overdue: "text-red-400",
  Today: "text-amber-300",
  Tomorrow: "text-emerald-300",
  "This week": "text-sky-300",
  Later: "text-zinc-400",
};

function ItemRow({ item }: { item: UpcomingItem }) {
  return (
    <a
      href={item.htmlUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-baseline justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-zinc-100">{item.name}</p>
        <p className="truncate text-xs text-zinc-500">{item.courseCode}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm text-zinc-300">{formatDue(item.dueAt)}</p>
        {item.pointsPossible != null && (
          <p className="text-xs text-zinc-500">{item.pointsPossible} pts</p>
        )}
      </div>
    </a>
  );
}

export default async function Home() {
  let data: DashboardData | undefined;
  let error: { message: string; status?: number; noToken?: boolean } | null =
    null;
  try {
    data = await getDashboard();
  } catch (err) {
    if (err instanceof CanvasError) {
      error = {
        message: err.message,
        status: err.status,
        noToken: !process.env.CANVAS_TOKEN,
      };
    } else {
      error = { message: err instanceof Error ? err.message : String(err) };
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">canvas-monster</h1>
          <p className="text-sm text-zinc-500">
            {data
              ? `${data.items.length} upcoming across ${data.courseCount} courses`
              : "Upcoming work across all your courses"}
          </p>
        </div>
        <Link href="/debug" className="text-xs text-zinc-500 hover:text-zinc-300">
          debug
        </Link>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
          <p className="font-medium">
            Couldn&apos;t load Canvas data
            {error.status ? ` (${error.status})` : ""}
          </p>
          <p className="mt-1 font-mono text-xs text-red-300/80">
            {error.message}
          </p>
          {error.noToken && (
            <p className="mt-2 text-red-200/80">
              Set <code>CANVAS_TOKEN</code> in <code>.env.local</code> and
              restart.
            </p>
          )}
        </div>
      ) : data && data.items.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 text-center text-zinc-400">
          🎉 Nothing due. You&apos;re all caught up.
        </p>
      ) : (
        <div className="space-y-8">
          {BUCKET_ORDER.map((bucket) => {
            const items =
              data?.items.filter(
                (i) => bucketFor(i.dueAt, new Date(data!.generatedAt)) === bucket,
              ) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={bucket}>
                <h2
                  className={`mb-3 text-sm font-semibold uppercase tracking-wide ${BUCKET_ACCENT[bucket]}`}
                >
                  {bucket}
                  <span className="ml-2 text-zinc-600">{items.length}</span>
                </h2>
                <div className="space-y-2">
                  {items.map((item) => (
                    <ItemRow key={item.assignmentId} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
