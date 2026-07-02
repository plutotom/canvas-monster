import Link from "next/link";
import { getCalendar, type CalendarItem } from "@/lib/canvas/calendar";
import { ErrorBox, toLoadError, type LoadError } from "@/components/error-box";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Parse ?month=YYYY-MM into a {year, month0} pair, defaulting to `fallback`. */
function parseMonth(
  raw: string | undefined,
  fallback: Date,
): { year: number; month0: number } {
  if (raw) {
    const m = raw.match(/^(\d{4})-(\d{2})$/);
    if (m) return { year: Number(m[1]), month0: Number(m[2]) - 1 };
  }
  return { year: fallback.getFullYear(), month0: fallback.getMonth() };
}

function monthKey(year: number, month0: number): string {
  return `${year}-${String(month0 + 1).padStart(2, "0")}`;
}

function shiftMonth(year: number, month0: number, delta: number) {
  const d = new Date(year, month0 + delta, 1);
  return { year: d.getFullYear(), month0: d.getMonth() };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;

  let data;
  let error: LoadError | null = null;
  try {
    data = await getCalendar();
  } catch (err) {
    error = toLoadError(err, !!process.env.CANVAS_TOKEN);
  }

  const now = data ? new Date(data.generatedAt) : new Date();
  const { year, month0 } = parseMonth(month, now);

  // Bucket items by local YYYY-MM-DD.
  const byDay = new Map<string, CalendarItem[]>();
  for (const it of data?.items ?? []) {
    const d = new Date(it.dueAt);
    if (d.getFullYear() !== year || d.getMonth() !== month0) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const arr = byDay.get(key) ?? [];
    arr.push(it);
    byDay.set(key, arr);
  }

  const firstWeekday = new Date(year, month0, 1).getDay();
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const monthLabel = new Date(year, month0, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const prev = shiftMonth(year, month0, -1);
  const next = shiftMonth(year, month0, 1);

  // Leading blanks + day cells, padded to full weeks.
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d: number) =>
    now.getFullYear() === year &&
    now.getMonth() === month0 &&
    now.getDate() === d;

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-[15px] font-semibold">{monthLabel}</h1>
        <div className="flex items-center gap-1 text-[13px]">
          <Link
            href={`/calendar?month=${monthKey(prev.year, prev.month0)}`}
            className="rounded-md border border-line px-2 py-1 text-muted-foreground hover:border-line-strong hover:text-foreground"
          >
            ← Prev
          </Link>
          <Link
            href="/calendar"
            className="rounded-md border border-line px-2 py-1 text-muted-foreground hover:border-line-strong hover:text-foreground"
          >
            Today
          </Link>
          <Link
            href={`/calendar?month=${monthKey(next.year, next.month0)}`}
            className="rounded-md border border-line px-2 py-1 text-muted-foreground hover:border-line-strong hover:text-foreground"
          >
            Next →
          </Link>
        </div>
      </header>

      {error ? (
        <ErrorBox error={error} />
      ) : (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-line bg-line">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="bg-app py-2 text-center text-[11px] font-medium text-faint"
            >
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            const items = d ? byDay.get(`${year}-${month0}-${d}`) ?? [] : [];
            return (
              <div key={i} className="min-h-24 bg-app p-1.5 align-top">
                {d && (
                  <>
                    <div
                      className={`mb-1 grid h-5 w-5 place-items-center rounded-full text-[11px] ${
                        isToday(d)
                          ? "font-semibold text-white"
                          : "text-faint"
                      }`}
                      style={isToday(d) ? { background: "var(--cm-accent)" } : undefined}
                    >
                      {d}
                    </div>
                    <div className="space-y-1">
                      {items.slice(0, 3).map((it) => (
                        <a
                          key={it.assignmentId}
                          href={it.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          title={`${it.courseCode} — ${it.name}`}
                          className={`block truncate rounded px-1 py-0.5 text-[10px] leading-tight ${
                            it.submitted
                              ? "bg-elevated text-faint line-through"
                              : "text-foreground hover:bg-elevated"
                          }`}
                          style={
                            it.submitted
                              ? undefined
                              : { background: "var(--cm-accent-soft)" }
                          }
                        >
                          {it.name}
                        </a>
                      ))}
                      {items.length > 3 && (
                        <p className="px-1 text-[10px] text-faint">
                          +{items.length - 3} more
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
