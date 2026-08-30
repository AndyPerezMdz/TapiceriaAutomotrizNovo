import { OrderTimeline } from "@/components/portal/OrderTimeline";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Car, Calendar } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteResponse } from "@/components/portal/QuoteResponse";
import { DeleteOrderButton } from "@/components/shared/DeleteOrderButton";
import { AddPhotoButton } from "@/components/portal/AddPhotoButton";
import { MarkAsViewed } from "@/components/portal/MarkAsViewed";
import { ReviewForm } from "@/components/portal/ReviewForm";
import { DownloadPdfButton } from "@/components/shared/DownloadPdfButton";
import { RepeatOrderButton } from "@/components/portal/RepeatOrderButton";
import { ShareTrackingButton } from "@/components/portal/ShareTrackingButton";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: order }, { data: photos }, { data: history }, { data: review }] =
    await Promise.all([
      supabase
        .from("orders")
        .select(
          "*, services(title), material_types(name), material_colors(name, hex_color), deleted_at",
        )
        .eq("id", id)
        .single(),
      supabase.from("order_photos").select("id, url").eq("order_id", id),
      supabase
        .from("order_status_history")
        .select("id, status, note, created_at, changed_by")
        .eq("order_id", id)
        .order("created_at", { ascending: true }),
      supabase.from("reviews").select("id, rating, comment").eq("order_id", id).maybeSingle(),
    ]);

  const changedByIds = [...new Set((history ?? []).map((h) => h.changed_by).filter(Boolean))];
  const { data: historyProfiles } = changedByIds.length
    ? await supabase.from("profiles").select("id, full_name, role").in("id", changedByIds)
    : { data: [] };

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

  const isFinalState = order.status === "entregado" || order.status === "cancelado";

  return (
    <div className="mx-auto max-w-3xl overflow-x-hidden">
      <MarkAsViewed orderId={order.id} />

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

          {order.status === "entregado" && !review ? (
            <ReviewForm orderId={order.id} />
          ) : null}

          {review ? (
            <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
              <p className="mb-1 text-sm font-semibold text-foreground">Tu reseña</p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={
                      star <= review.rating
                        ? "text-brand-yellow"
                        : "text-black/15 dark:text-white/15"
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              {review.comment ? (
                <p className="mt-2 break-words text-sm text-muted">{review.comment}</p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Car size={16} /> Descripción
            </h2>
            {order.services ? (
              <p className="mb-1 text-sm font-medium text-brand-yellow-dark dark:text-brand-yellow">
                {(order.services as unknown as { title: string }).title}
              </p>
            ) : null}
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

            {order.estimated_price !== null ? (
              <div className="mt-3">
                <DownloadPdfButton
                  orderId={order.id}
                  label={order.status === "entregado" ? "Descargar recibo" : "Descargar cotización"}
                />
              </div>
              
            ) : null}

            <div className="mt-2">
              <RepeatOrderButton orderId={order.id} />
            </div>

            <div className="mt-2">
              <ShareTrackingButton orderId={order.id} existingToken={order.share_token} />
            </div>
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

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Fotos</h2>
              {!isFinalState ? <AddPhotoButton orderId={order.id} /> : null}
            </div>
            {photos && photos.length > 0 ? (
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
            ) : (
              <p className="text-sm text-muted">Aún no hay fotos en este pedido.</p>
            )}
          </div>

          <DeleteOrderButton orderId={order.id} redirectTo="/portal/pedidos" />
        </div>

        <div className="min-w-0 rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Seguimiento
          </h2>
          {history && history.length > 0 ? (
            <OrderTimeline
              history={history}
              profiles={historyProfiles ?? []}
              currentUserId={user?.id ?? null}
            />
          ) : (
            <p className="text-sm text-muted">Sin actualizaciones todavía.</p>
          )}
        </div>
      </div>
    </div>
  );
}