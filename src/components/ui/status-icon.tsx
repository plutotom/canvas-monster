export type Status = "todo" | "progress" | "done";

/**
 * Linear-style status circle: empty ring (todo) / half amber pie (progress) /
 * filled green check (done). Pass `color` to override the ring (e.g. group
 * headers colored by urgency). See docs/DESIGN.md §4.
 */
export function StatusIcon({
  status,
  color,
  size = 15,
}: {
  status: Status;
  color?: string;
  size?: number;
}) {
  const stroke =
    color ??
    (status === "done"
      ? "var(--cm-green)"
      : status === "progress"
        ? "var(--cm-amber)"
        : "var(--cm-faint)");
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className="shrink-0">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke={stroke} strokeWidth="1.5" />
      {status === "progress" && <path d="M8 8 L8 2 A6 6 0 0 1 8 14 Z" fill={stroke} />}
      {status === "done" && (
        <>
          <circle cx="8" cy="8" r="6.5" fill={stroke} />
          <path
            d="M5 8 l2 2 l4-4.2"
            fill="none"
            stroke="var(--cm-card)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
