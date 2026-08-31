import { OrderTimeline } from "@/components/portal/OrderTimeline";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Car, Calendar, MessageCircle } from "lucide-react";
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
import { buildWhatsAppLink } from "@/lib/constants/business";
import { getBusinessSettings } from "@/lib/data/business-settings";

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

  const [{ data: order }, { data: items }, { data: photos }, { data: history }, { data: review }, settings] =
    await Promise.all([
      supabase
        .from("orders")
        .select("*, deleted_at")
        .eq("id", id)
        .single(),
      supabase
        .from("order_items")
        .select(
          "id, price, services(title), material_types(name), material_colors(name, hex_color)",
        )
        .eq("order_id", id)
        .order("order", { ascending: true }),
      supabase.from("order_photos").select("id, url").eq("order_id", id),
      supabase
        .from("order_status_history")
        .select("id, status, note, created_at, changed_by")
        .eq("order_id", id)
        .order("created_at", { ascending: true }),
      supabase.from("reviews").select("id, rating, comment").eq("order_id", id).maybeSingle(),
      getBusinessSettings(),
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
  const isApprovedOrLater = !["pendiente_revision", "cotizado", "rechazado"].includes(
    order.status,
  );

  const formattedItems =
    items?.map((item) => {
      const service = item.services as unknown as { title: string } | null;
      const material = item.material_types as unknown as { name: string } | null;
      const color = item.material_colors as unknown as { name: string } | null;
      return {
        id: item.id,
        title: service?.title ?? "Servicio",
        materialLabel:
          material?.name && color?.name
            ? `${material.name} · ${color.name}`
            : material?.name ?? null,
        price: item.price,
      };
    }) ?? [];

  const whatsappHref = buildWhatsAppLink(
    `Hola, quiero agregar otro servicio a mi pedido de ${vehicle || "mi vehículo"} (ya aprobado).`,
    settings.whatsapp,
  );

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
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Car size={16} /> Servicios de este pedido
            </h2>

            <div className="space-y-3">
              {formattedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5"
                >
                  <div>
                    <p className="text-sm font-medium text-brand-yellow-dark dark:text-brand-yellow">
                      {formattedItems.length > 1 ? `${index + 1}. ` : ""}
                      {item.title}
                    </p>
                    {item.materialLabel ? (
                      <p className="text-xs text-muted">{item.materialLabel}</p>
                    ) : null}
                  </div>
                  {item.price !== null ? (
                    <p className="text-sm font-medium text-foreground">
                      ${item.price.toLocaleString("es-MX")}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <p className="mt-4 break-words text-sm text-muted">{order.service_description}</p>

            {order.estimated_price ? (
              <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
                <p className="text-sm text-muted">
                  {order.status === "entregado" ? "Precio final" : "Precio total estimado"}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  ${order.estimated_price.toLocaleString("es-MX")}
                </p>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {order.estimated_price !== null ? (
                <DownloadPdfButton
                  orderId={order.id}
                  label={order.status === "entregado" ? "Descargar recibo" : "Descargar cotización"}
                />
              ) : null}
              <RepeatOrderButton orderId={order.id} />
              <ShareTrackingButton orderId={order.id} existingToken={order.share_token} />
            </div>
          </div>

          {isApprovedOrLater && !isFinalState ? (
            <div className="rounded-lg border border-brand-yellow/30 bg-brand-yellow/10 p-5">
              <p className="text-sm font-medium text-foreground">
                ¿Quieres agregar otro servicio a este pedido?
              </p>
              <p className="mt-1 text-sm text-muted">
                Como tu cotización ya fue aceptada, para agregar un servicio nuevo necesitas
                visitar el taller en persona, o escribirnos por WhatsApp para que lo agreguemos
                como nota en tu pedido.
              </p>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-fit items-center gap-2 rounded-md border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-2 text-sm font-medium text-[#25D366] transition hover:bg-[#25D366]/20"
              >
                <MessageCircle size={16} /> Escribir por WhatsApp
              </a>
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