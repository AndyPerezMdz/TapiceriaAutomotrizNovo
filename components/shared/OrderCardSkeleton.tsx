import { Skeleton } from "@/components/shared/Skeleton";

export function OrderCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

export function OrderCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}