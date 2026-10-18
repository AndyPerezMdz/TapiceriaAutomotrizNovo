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
    <div className="max-w-3xl">
      <Link
        href="/portal/quejas"
        className="mb-6 inline-flex items-center gap-1.5 text-[15px] font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={16} /> Volver a mis quejas
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl text-foreground">Detalle de tu queja</h1>
        <span className="rounded-full bg-highlight px-3 py-1 text-[13px] font-medium text-yellow-text">
          {statusLabels[complaint.status]}
        </span>
      </div>

      {order ? (
        <div className="mb-4 rounded-2xl bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
          <h2 className="font-display text-2xl font-bold uppercase mb-3 flex items-center gap-1.5 text-foreground">
            <Car size={16} /> {vehicle || "Pedido"}
          </h2>
          <p className="mb-3 text-[13px] text-muted">
            Folio: <span className="font-mono font-medium text-foreground">{order.id.slice(0, 8).toUpperCase()}</span>
          </p>
          <div className="space-y-2">
            {formattedItems.map((item) => (
              <div key={item.id} className="text-[15px]">
                <p className="font-medium text-foreground">{item.title}</p>
                {item.materialLabel ? <p className="text-[13px] text-muted">{item.materialLabel}</p> : null}
              </div>
            ))}
          </div>
          {order.final_price ?? order.estimated_price ? (
            <p className="mt-3 border-t-2 border-dashed border-seam pt-3 text-[15px] font-semibold text-foreground">
              Total: ${(order.final_price ?? order.estimated_price)?.toLocaleString("es-MX")}
            </p>
          ) : null}
          <Link
            href={`/portal/pedidos/${order.id}`}
            className="mt-3 inline-block text-[13px] font-medium text-yellow-text hover:underline"
          >
            Ver pedido completo →
          </Link>
        </div>
      ) : null}

      <div className="mb-4 rounded-2xl bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
        <p className="mb-1 flex items-center gap-1.5 text-[13px] text-muted">
          <Calendar size={11} />
          {new Date(complaint.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <p className="mt-2 break-words text-[15px] text-foreground">{complaint.description}</p>
      </div>

      {complaint.resolution_note ? (
        <div className="mb-4 rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-black/5 p-5 dark:bg-white/5">
          <p className="mb-1 text-[13px] font-semibold text-muted">Respuesta del taller</p>
          <p className="text-[15px] text-foreground">{complaint.resolution_note}</p>
        </div>
      ) : null}

      {complaint.satisfaction_rating ? (
        <div className="rounded-2xl border-2 border-dashed border-brand-yellow-dark/50 bg-highlight p-5">
          <p className="mb-1 text-[15px] font-medium text-foreground">Tu calificación</p>
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
            <p className="mt-2 text-[15px] text-muted">{complaint.satisfaction_comment}</p>
          ) : null}
        </div>
      ) : canRate ? (
        <ComplaintRatingForm complaintId={complaint.id} />
      ) : null}
    </div>
  );
}