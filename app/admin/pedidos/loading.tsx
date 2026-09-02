import { OrderCardSkeletonList } from "@/components/shared/OrderCardSkeleton";
import { Skeleton } from "@/components/shared/Skeleton";

export default function AdminPedidosLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-7 w-48" />
      <Skeleton className="mb-6 h-10 w-full rounded-md" />
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <OrderCardSkeletonList count={6} />
    </div>
  );
}