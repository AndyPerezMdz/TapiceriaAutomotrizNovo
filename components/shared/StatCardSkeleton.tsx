import { Skeleton } from "@/components/shared/Skeleton";

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-black/10 bg-surface p-4 text-center dark:border-white/10">
      <Skeleton className="mx-auto h-7 w-10" />
      <Skeleton className="mx-auto mt-2 h-3 w-16" />
    </div>
  );
}