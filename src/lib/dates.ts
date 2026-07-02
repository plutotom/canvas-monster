/** Date helpers for grouping upcoming work into human buckets. */

export type Bucket = "Overdue" | "Today" | "Tomorrow" | "This week" | "Later";

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function bucketFor(dueAt: string, now = new Date()): Bucket {
  const due = new Date(dueAt);
  const today0 = startOfDay(now).getTime();
  const due0 = startOfDay(due).getTime();
  const diffDays = Math.round((due0 - today0) / DAY);

  if (due.getTime() < now.getTime() && diffDays <= 0) return "Overdue";
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return "This week";
  return "Later";
}

export const BUCKET_ORDER: Bucket[] = [
  "Overdue",
  "Today",
  "Tomorrow",
  "This week",
  "Later",
];

/** e.g. "Mon, Jul 6 · 11:59 PM" */
export function formatDue(dueAt: string): string {
  const d = new Date(dueAt);
  const date = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

/** Compact right-column date, e.g. "Jul 6". */
export function formatShort(dueAt: string): string {
  return new Date(dueAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Map a due bucket to a Linear priority level (0 none → 3 high). */
export function priorityForBucket(bucket: Bucket): 0 | 1 | 2 | 3 {
  switch (bucket) {
    case "Overdue":
    case "Today":
      return 3;
    case "Tomorrow":
      return 2;
    case "This week":
      return 1;
    default:
      return 0;
  }
}
