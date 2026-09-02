import { OrderCardSkeletonList } from "@/components/shared/OrderCardSkeleton";
import { Skeleton } from "@/components/shared/Skeleton";

export default function HistorialLoading() {
  return (
    <div>
      <Skeleton className="mb-2 h-7 w-56" />
      <Skeleton className="mb-8 h-4 w-72" />
      <Skeleton className="mb-4 h-10 w-full rounded-md" />
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <OrderCardSkeletonList count={5} />
    </div>
  );
}