import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full gap-2 overflow-hidden px-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex w-[300px] shrink-0 flex-col gap-2 rounded-xl bg-column p-2"
        >
          <Skeleton className="mx-1 mt-1 h-4 w-24" />
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton key={j} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}
