/** Tiny donut showing done/total; filled arc in the brand accent. */
export function ProgressRing({ done, total }: { done: number; total: number }) {
  const frac = total ? done / total : 0;
  const r = 5;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" className="shrink-0">
      <circle cx="7" cy="7" r={r} fill="none" stroke="var(--cm-line-strong)" strokeWidth="2" />
      <circle
        cx="7"
        cy="7"
        r={r}
        fill="none"
        stroke="var(--cm-accent)"
        strokeWidth="2"
        strokeDasharray={`${circ * frac} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 7 7)"
      />
    </svg>
  );
}
