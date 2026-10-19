import { OrderCardSkeletonList } from "@/components/shared/OrderCardSkeleton";
import { Skeleton } from "@/components/shared/Skeleton";

export default function HistorialLoading() {
  return (
    <div>
      <Skeleton className="mb-3 h-12 w-56" />
      <Skeleton className="mb-8 h-4 w-72" />
      <Skeleton className="mb-5 h-12 w-full rounded-xl" />
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-11 w-20 rounded-full" />
        <Skeleton className="h-11 w-24 rounded-full" />
        <Skeleton className="h-11 w-24 rounded-full" />
      </div>
      <OrderCardSkeletonList count={5} />
    </div>
  );
}