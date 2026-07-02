import { Skeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="mt-2 h-3 w-24" />
      <ListSkeleton rows={5} />
    </div>
  );
}
