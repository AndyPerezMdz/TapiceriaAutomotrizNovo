import { OrderCardSkeletonList } from "@/components/shared/OrderCardSkeleton";
import { StatCardSkeleton } from "@/components/shared/StatCardSkeleton";
import { Skeleton } from "@/components/shared/Skeleton";

export default function PortalLoading() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <Skeleton className="mb-4 h-4 w-24" />
      <OrderCardSkeletonList count={3} />
    </div>
  );
}