import { OrderTimeline } from "@/components/portal/OrderTimeline";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Car, Calendar } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteResponse } from "@/components/portal/QuoteResponse";
import { DeleteOrderButton } from "@/components/shared/DeleteOrderButton";

const statusLabels: Record<string, string> = {
  pendiente_revision: "Pendiente de revisión",
  cotizado: "Cotizado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  en_proceso: "En proceso",
  listo_para_entrega: "Listo para entrega",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PedidoDetallePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: photos }, { data: history }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "*, material_types(name), material_colors(name, hex_color), deleted_at",
      )
      .eq("id", id)
      .single(),
    supabase.from("order_photos").select("id, url").eq("order_id", id),
    supabase
      .from("order_status_history")
      .select("id, status, note, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!order) {
    notFound();
  }

  if (order.deleted_at) {
    return (
      <div className="mx-auto max-w-md text-center">
        <Link
          href="/portal/pedidos"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={16} /> Volver al historial
        </Link>
        <div className="rounded-lg border border-black/10 bg-surface p-10 dark:border-white/10">
          <p className="font-medium text-foreground">Este pedido fue eliminado</p>
          <p className="mt-2 text-sm text-muted">
            Ya no se puede consultar la información de este pedido.
          </p>
        </div>
      </div>
    );
  }

  const vehicle = [order.vehicle_make, order.vehicle_model, order.vehicle_year]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto max-w-3xl overflow-x-hidden">
      <Link
        href="/portal"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={16} /> Volver a mis pedidos
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {vehicle || "Pedido"}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <Calendar size={14} />
            {new Date(order.created_at).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span className="rounded-full bg-brand-yellow/20 px-3 py-1 text-xs font-medium text-brand-yellow-dark dark:text-brand-yellow">
          {statusLabels[order.status] ?? order.status}
        </span>
      </div>

      <div className="grid gap-8 sm:grid-cols-[1fr_1.2fr]">
        <div className="min-w-0 space-y-6">
          {order.status === "cotizado" ? (
            <QuoteResponse orderId={order.id} estimatedPrice={order.estimated_price} />
          ) : null}

          <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Car size={16} /> Descripción
            </h2>
            <p className="break-words text-sm text-muted">
              {order.service_description}
            </p>

            {order.estimated_price ? (
              <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
                <p className="text-sm text-muted">Precio estimado</p>
                <p className="text-lg font-semibold text-foreground">
                  ${order.estimated_price.toLocaleString("es-MX")}
                </p>
              </div>
            ) : null}
          </div>

          {order.material_types || order.material_colors ? (
            <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
              <h2 className="mb-2 text-sm font-semibold text-foreground">
                Material elegido
              </h2>
              <p className="break-words text-sm text-muted">
                {(order.material_types as unknown as { name: string } | null)?.name}
                {order.material_colors ? (
                  <>
                    {" "}
                    ·{" "}
                    {(order.material_colors as unknown as { name: string }).name}
                  </>
                ) : null}
              </p>
            </div>
          ) : null}

          {photos && photos.length > 0 ? (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Fotos</h2>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square overflow-hidden rounded-md border border-black/10 dark:border-white/10"
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <DeleteOrderButton orderId={order.id} redirectTo="/portal/pedidos" />
        </div>

        <div className="min-w-0 rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Seguimiento
          </h2>
          {history && history.length > 0 ? (
            <OrderTimeline history={history} />
          ) : (
            <p className="text-sm text-muted">Sin actualizaciones todavía.</p>
          )}
        </div>
      </div>
    </div>
  );
}