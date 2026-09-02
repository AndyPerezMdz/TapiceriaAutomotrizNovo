import { OrderCardSkeletonList } from "@/components/shared/OrderCardSkeleton";
import { StatCardSkeleton } from "@/components/shared/StatCardSkeleton";
import { Skeleton } from "@/components/shared/Skeleton";

export default function AdminLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <Skeleton className="mb-8 h-16 w-full rounded-lg" />

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Skeleton className="mb-4 h-4 w-32" />
          <OrderCardSkeletonList count={4} />
        </div>
        <div>
          <Skeleton className="mb-4 h-4 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}