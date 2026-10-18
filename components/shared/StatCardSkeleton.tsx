import { Skeleton } from "@/components/shared/Skeleton";

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface p-5 sm:p-6 text-center dark:ring-1 dark:ring-white/5">
      <Skeleton className="mx-auto h-7 w-10" />
      <Skeleton className="mx-auto mt-2 h-3 w-16" />
    </div>
  );
}