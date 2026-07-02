import { cn } from "@/lib/utils";

/**
 * Linear-style pill chip — labels (leading colored dot), courses/projects
 * (leading icon), progress (leading ring). See docs/DESIGN.md §4.
 */
export function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white/[0.02] px-2 py-[3px] text-[11.5px] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Small colored dot used inside label pills and course lists. */
export function Dot({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn("h-1.5 w-1.5 shrink-0 rounded-full", className)}
      style={{ background: color }}
    />
  );
}
