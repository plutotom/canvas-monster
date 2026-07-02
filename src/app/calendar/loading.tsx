import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      <Skeleton className="mb-4 h-6 w-40" />
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-line bg-line">
        {Array.from({ length: 42 }).map((_, i) => (
          <div key={i} className="min-h-24 bg-app p-1.5">
            <Skeleton className="h-4 w-5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
