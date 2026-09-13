import { ComplaintDetailPanel } from "@/components/admin/ComplaintDetailPanel";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Calendar, Car } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminQuejaDetallePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: complaint } = await supabase
    .from("complaints")
    .select(
      "id, description, status, resolution_note, source, created_at, satisfaction_rating, satisfaction_comment, order_id, profiles!complaints_client_id_fkey(full_name, phone)",
    )
    .eq("id", id)
    .single();

  if (!complaint) {
    notFound();
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, vehicle_make, vehicle_model, vehicle_year, status, estimated_price, final_price, created_at, service_description")
    .eq("id", complaint.order_id)
    .single();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, price, services(title), material_types(name), material_colors(name)")
    .eq("order_id", complaint.order_id)
    .order("order", { ascending: true });

  const client = complaint.profiles as unknown as { full_name: string; phone: string | null } | null;

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

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/quejas"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={16} /> Volver a quejas
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{client?.full_name}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <Calendar size={14} />
          {new Date(complaint.created_at).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          · {complaint.source === "web" ? "Reportada en línea" : "Reportada por WhatsApp"}
        </p>
      </div>

      {order ? (
        <div className="mb-6 rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Car size={16} /> {vehicle || "Vehículo sin detalle"}
          </h2>
          <p className="mb-3 text-xs text-muted">
            Folio: <span className="font-mono font-medium text-foreground">{order.id.slice(0, 8).toUpperCase()}</span>
            {" · Estado del pedido: "}
            <span className="font-medium text-foreground">{order.status}</span>
          </p>

          <div className="space-y-2">
            {formattedItems.map((item, index) => (
              <div key={item.id} className="rounded-md border border-black/10 px-3 py-2 dark:border-white/10">
                <p className="text-sm font-medium text-brand-yellow-dark dark:text-brand-yellow">
                  {formattedItems.length > 1 ? `${index + 1}. ` : ""}
                  {item.title}
                </p>
                {item.materialLabel ? <p className="text-xs text-muted">{item.materialLabel}</p> : null}
                {item.price !== null ? (
                  <p className="mt-0.5 text-xs text-foreground">${item.price.toLocaleString("es-MX")}</p>
                ) : null}
              </div>
            ))}
          </div>

          <p className="mt-3 break-words text-sm text-muted">{order.service_description}</p>

          {order.final_price ?? order.estimated_price ? (
            <p className="mt-3 border-t border-black/10 pt-3 text-sm font-semibold text-foreground dark:border-white/10">
              Total: ${(order.final_price ?? order.estimated_price)?.toLocaleString("es-MX")}
            </p>
          ) : null}

          <Link
            href={`/admin/pedidos/${order.id}`}
            className="mt-3 inline-block text-xs font-medium text-brand-yellow-dark hover:underline dark:text-brand-yellow"
          >
            Ver pedido completo →
          </Link>
        </div>
      ) : null}

      <ComplaintDetailPanel
        complaintId={complaint.id}
        description={complaint.description}
        status={complaint.status}
        resolutionNote={complaint.resolution_note}
        clientPhone={client?.phone ?? null}
        clientName={client?.full_name ?? null}
        satisfactionRating={complaint.satisfaction_rating}
        satisfactionComment={complaint.satisfaction_comment}
      />
    </div>
  );
}