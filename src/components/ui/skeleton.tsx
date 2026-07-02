import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={cn("animate-pulse rounded-md bg-elevated", className)} style={style} />;
}

/** A stack of shimmering list rows — matches the dense list layout. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="px-2 pt-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-[9px]">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3 flex-1" style={{ maxWidth: `${40 + ((i * 17) % 45)}%` }} />
          <Skeleton className="ml-auto h-4 w-16 rounded-full" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}
