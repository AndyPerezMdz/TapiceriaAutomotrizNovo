import { Skeleton } from "@/components/shared/Skeleton";

export function OrderCardSkeleton() {
  return (
    <div className="flex min-h-[76px] items-center justify-between rounded-2xl bg-surface px-5 py-4 sm:px-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-7 w-24 rounded-xl" />
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