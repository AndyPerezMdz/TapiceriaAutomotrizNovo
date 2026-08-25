import { ReviewPublishToggle } from "@/components/admin/ReviewPublishToggle";
import { createClient } from "@/lib/supabase/server";
import { Star } from "lucide-react";

const ratingFilters = [
  { value: "all", label: "Todas" },
  { value: "good", label: "Buenas (2.5 - 5★)", min: 2.5, max: 5 },
  { value: "bad", label: "Malas (1 - 2.5★)", min: 1, max: 2.5 },
];

interface Props {
  searchParams: Promise<{ rating?: string }>;
}

export default async function AdminResenasPage({ searchParams }: Props) {
  const { rating } = await searchParams;
  const activeFilter = ratingFilters.find((f) => f.value === rating) ?? ratingFilters[0];

  const supabase = await createClient();
  let query = supabase
    .from("reviews")
    .select(
      "id, rating, comment, is_published, created_at, profiles!reviews_client_id_fkey(full_name), orders(vehicle_make, vehicle_model)",
    )
    .order("created_at", { ascending: false });

  if (activeFilter.min !== undefined) {
    query = query.gte("rating", activeFilter.min).lte("rating", activeFilter.max!);
  }

  const { data: reviews } = await query;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Reseñas de clientes
      </h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {ratingFilters.map((f) => (
          <a
            key={f.value}
            href={f.value === "all" ? "/admin/resenas" : `/admin/resenas?rating=${f.value}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeFilter.value === f.value
                ? "bg-brand-black text-white dark:bg-white dark:text-brand-black"
                : "border border-black/15 text-muted hover:border-black/30 dark:border-white/15"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {!reviews || reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
          <p className="text-muted">No hay reseñas en este filtro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const client = review.profiles as unknown as { full_name: string } | null;
            const order = review.orders as unknown as {
              vehicle_make: string | null;
              vehicle_model: string | null;
            } | null;
            const vehicle = [order?.vehicle_make, order?.vehicle_model].filter(Boolean).join(" ");

            return (
              <div
                key={review.id}
                className="rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{client?.full_name}</p>
                    {vehicle ? <p className="text-xs text-muted">{vehicle}</p> : null}
                    <div className="mt-1 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={
                            star <= review.rating
                              ? "fill-brand-yellow text-brand-yellow-dark"
                              : "text-black/15 dark:text-white/15"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <ReviewPublishToggle reviewId={review.id} isPublished={review.is_published} />
                </div>
                {review.comment ? (
                  <p className="mt-2 break-words text-sm text-muted">{review.comment}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}