import { ComplaintRatingForm } from "@/components/portal/ComplaintRatingForm";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Calendar, Car } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const statusLabels: Record<string, string> = {
  abierta: "Abierta",
  atendida: "Atendida",
  cerrada: "Cerrada",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClienteQuejaDetallePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: complaint } = await supabase
    .from("complaints")
    .select(
      "id, description, status, resolution_note, source, created_at, satisfaction_rating, satisfaction_comment, order_id, client_id",
    )
    .eq("id", id)
    .single();

  if (!complaint || complaint.client_id !== user?.id) {
    notFound();
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, vehicle_make, vehicle_model, vehicle_year, estimated_price, final_price")
    .eq("id", complaint.order_id)
    .single();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, price, services(title), material_types(name), material_colors(name)")
    .eq("order_id", complaint.order_id)
    .order("order", { ascending: true });

  const vehicle = order
    ? [order.vehicle_make, order.vehicle_model, order.vehicle_year].filter(Boolean).join(" ")
    : "";

  const formattedItems =
    items?.map((item) => {
      const service = item.services as unknown as { title: string } | null;
      const material = item.material_types as unknown as { name: string } | null;
      const color = item.material_colors as unknown as { name: string } | null;
      return {
        id: item.id,
        title: service?.title ?? "Servicio",
        materialLabel:
          material?.name && color?.name ? `${material.name} · ${color.name}` : material?.name ?? null,
        price: item.price,
      };
    }) ?? [];

  const canRate = (complaint.status === "atendida" || complaint.status === "cerrada") && !complaint.satisfaction_rating;

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/portal/quejas"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={16} /> Volver a mis quejas
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Detalle de tu queja</h1>
        <span className="rounded-full bg-brand-yellow/20 px-3 py-1 text-xs font-medium text-brand-yellow-dark dark:text-brand-yellow">
          {statusLabels[complaint.status]}
        </span>
      </div>

      {order ? (
        <div className="mb-4 rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Car size={16} /> {vehicle || "Pedido"}
          </h2>
          <p className="mb-3 text-xs text-muted">
            Folio: <span className="font-mono font-medium text-foreground">{order.id.slice(0, 8).toUpperCase()}</span>
          </p>
          <div className="space-y-2">
            {formattedItems.map((item) => (
              <div key={item.id} className="text-sm">
                <p className="font-medium text-foreground">{item.title}</p>
                {item.materialLabel ? <p className="text-xs text-muted">{item.materialLabel}</p> : null}
              </div>
            ))}
          </div>
          {order.final_price ?? order.estimated_price ? (
            <p className="mt-3 border-t border-black/10 pt-3 text-sm font-semibold text-foreground dark:border-white/10">
              Total: ${(order.final_price ?? order.estimated_price)?.toLocaleString("es-MX")}
            </p>
          ) : null}
          <Link
            href={`/portal/pedidos/${order.id}`}
            className="mt-3 inline-block text-xs font-medium text-brand-yellow-dark hover:underline dark:text-brand-yellow"
          >
            Ver pedido completo →
          </Link>
        </div>
      ) : null}

      <div className="mb-4 rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
        <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
          <Calendar size={11} />
          {new Date(complaint.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <p className="mt-2 break-words text-sm text-foreground">{complaint.description}</p>
      </div>

      {complaint.resolution_note ? (
        <div className="mb-4 rounded-lg border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-white/5">
          <p className="mb-1 text-xs font-semibold text-muted">Respuesta del taller</p>
          <p className="text-sm text-foreground">{complaint.resolution_note}</p>
        </div>
      ) : null}

      {complaint.satisfaction_rating ? (
        <div className="rounded-lg border border-brand-yellow/30 bg-brand-yellow/10 p-5">
          <p className="mb-1 text-sm font-medium text-foreground">Tu calificación</p>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={star <= complaint.satisfaction_rating! ? "text-brand-yellow" : "text-black/15 dark:text-white/15"}
              >
                ★
              </span>
            ))}
          </div>
          {complaint.satisfaction_comment ? (
            <p className="mt-2 text-sm text-muted">{complaint.satisfaction_comment}</p>
          ) : null}
        </div>
      ) : canRate ? (
        <ComplaintRatingForm complaintId={complaint.id} />
      ) : null}
    </div>
  );
}