import { MoreHorizontal } from "lucide-react";

export type PriorityLevel = 0 | 1 | 2 | 3; // 0 none, 1 low, 2 med, 3 high

/**
 * Linear-style priority indicator: three signal bars, `level` of them filled.
 * Level 0 renders faint dashes (···). See docs/DESIGN.md §4.
 */
export function PriorityIcon({ level }: { level: PriorityLevel }) {
  if (level === 0) {
    return <MoreHorizontal size={15} className="shrink-0 text-faint" />;
  }
  const heights = [4, 7, 10];
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" className="shrink-0">
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * 5 + 1}
          y={11 - h}
          width="3"
          height={h}
          rx="1"
          fill={i < level ? "var(--cm-muted)" : "var(--cm-line-strong)"}
        />
      ))}
    </svg>
  );
}
