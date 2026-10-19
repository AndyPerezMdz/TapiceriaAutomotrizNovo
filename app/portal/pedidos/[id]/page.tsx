import { StorageImage } from "@/components/shared/StorageImage";
import { OrderTimeline } from "@/components/portal/OrderTimeline";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
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
import { WhatsAppLink } from "@/components/shared/WhatsAppLink";
import { ComplaintForm } from "@/components/portal/ComplaintForm";
import {
  SectionTitle,
  Stamp,
  StageStepper,
  Ticket,
  cardClass,
  displayClass,
  eyebrowClass,
  seamClass,
  type StepperStage,
} from "@/components/taller";

const statusLabels: Record<string, string> = {
  pendiente_revision: "Por revisar",
  cotizado: "Cotizado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  en_proceso: "En proceso",
  listo_para_entrega: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

interface Props {
  params: Promise<{ id: string }>;
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    timeZone: "America/Merida",
  });
}

function money(value: number) {
  return `$${Number(value).toLocaleString("es-MX")}`;
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
          "id, price, service_id, current_stage_id, services(title), material_types(name), material_colors(name, hex_color)",
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

  if (!order) {
    notFound();
  }

  if (order.deleted_at) {
    return (
      <div className="mx-auto max-w-md text-center">
        <Link
          href="/portal/pedidos"
          className="mb-6 inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={18} /> Volver al historial
        </Link>
        <div className={`${cardClass} !py-12`}>
          <p className="font-display text-2xl font-bold uppercase text-foreground">
            Este pedido fue eliminado
          </p>
          <p className="mt-2 text-[15px] text-muted">
            Ya no se puede consultar la información de este pedido.
          </p>
        </div>
      </div>
    );
  }

  const itemIds = (items ?? []).map((i) => i.id);
  const serviceIds = [
    ...new Set((items ?? []).map((i) => i.service_id).filter((s): s is string => Boolean(s))),
  ];
  const changedByIds = [...new Set((history ?? []).map((h) => h.changed_by).filter(Boolean))];

  const [{ data: historyProfiles }, { data: stagesData }, { data: stageHistory }] = await Promise.all([
    changedByIds.length
      ? supabase.from("profiles").select("id, full_name, role").in("id", changedByIds)
      : Promise.resolve({ data: [] }),
    serviceIds.length
      ? supabase
          .from("service_stages")
          .select("id, service_id, name, client_description, order, is_active")
          .in("service_id", serviceIds)
          .order("order", { ascending: true })
      : Promise.resolve({ data: [] }),
    itemIds.length
      ? supabase
          .from("order_item_stage_history")
          .select("order_item_id, stage_id, created_at")
          .in("order_item_id", itemIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);
  const allStages = stagesData ?? [];

  const vehicle = [order.vehicle_make, order.vehicle_model, order.vehicle_year]
    .filter(Boolean)
    .join(" ");

  const isFinalState = order.status === "entregado" || order.status === "cancelado";
  const isApprovedOrLater = !["pendiente_revision", "cotizado", "rechazado"].includes(
    order.status,
  );
  const showStages = isApprovedOrLater && order.status !== "cancelado";
  const stagesCompleted =
    order.status === "listo_para_entrega" || order.status === "entregado";

  const formattedItems =
    items?.map((item) => {
      const service = item.services as unknown as { title: string } | null;
      const material = item.material_types as unknown as { name: string } | null;
      const color = item.material_colors as unknown as { name: string } | null;
      const currentStageId = (item.current_stage_id as string | null) ?? null;
      const since = (stageHistory ?? []).find(
        (h) => h.order_item_id === item.id && h.stage_id === currentStageId,
      );
      return {
        id: item.id,
        title: service?.title ?? "Servicio",
        materialLabel:
          material?.name && color?.name
            ? `${material.name} · ${color.name}`
            : material?.name ?? null,
        price: item.price as number | null,
        currentStageId,
        currentSince: since ? `En curso desde ${shortDate(since.created_at)}` : null,
        stages: allStages
          .filter(
            (s) =>
              s.service_id === item.service_id &&
              (s.is_active || s.id === item.current_stage_id),
          )
          .map<StepperStage>((s) => ({
            id: s.id,
            name: s.name,
            client_description: s.client_description,
          })),
      };
    }) ?? [];

  const itemsWithStages = formattedItems.filter((i) => i.stages.length > 0);
  const totalStages = itemsWithStages.reduce((n, i) => n + i.stages.length, 0);
  const doneStages = stagesCompleted
    ? totalStages
    : itemsWithStages.reduce((n, i) => {
        const idx = i.stages.findIndex((s) => s.id === i.currentStageId);
        return n + Math.max(0, idx);
      }, 0);

  const total = order.final_price ?? order.estimated_price;
  const lastUpdate = history && history.length > 0 ? history[history.length - 1].created_at : null;

  const whatsappHref = buildWhatsAppLink(
    `Hola, quiero agregar otro servicio a mi pedido de ${vehicle || "mi vehículo"} (ya aprobado).`,
    settings.whatsapp,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 overflow-x-hidden sm:space-y-10">
      <MarkAsViewed orderId={order.id} />

      <Link
        href="/portal"
        className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={18} /> Mis pedidos
      </Link>

      <Ticket
        className="!mt-2"
        stub={
          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-6">
            <div>
              <dt className="text-[13px] uppercase tracking-[0.14em] text-on-ink-muted">Folio</dt>
              <dd className="mt-1.5 font-code text-base sm:text-lg">
                {order.id.slice(0, 8).toUpperCase()}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] uppercase tracking-[0.14em] text-on-ink-muted">Ingresó</dt>
              <dd className="mt-1.5 text-base font-medium sm:text-lg">
                {new Date(order.created_at).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                })}
              </dd>
            </div>
            {order.delivered_at ? (
              <div>
                <dt className="text-[13px] uppercase tracking-[0.14em] text-on-ink-muted">Entregado</dt>
                <dd className="mt-1.5 text-base font-medium sm:text-lg">
                  {new Date(order.delivered_at).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                  })}
                </dd>
              </div>
            ) : null}
            {total ? (
              <div>
                <dt className="text-[13px] uppercase tracking-[0.14em] text-on-ink-muted">
                  {order.status === "entregado" ? "Total" : "Total estimado"}
                </dt>
                <dd className="mt-1 font-display text-[26px] font-bold leading-none">
                  {money(total)}
                </dd>
              </div>
            ) : null}
          </dl>
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="font-display text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-yellow sm:text-[15px]">
              Orden de trabajo
            </p>
            <h1 className={`${displayClass} mt-2 text-[44px] sm:text-[72px]`}>
              {vehicle || "Pedido"}
            </h1>
          </div>
          <Stamp
            label={statusLabels[order.status] ?? order.status}
            detail={lastUpdate ? `Actualizado ${shortDate(lastUpdate)}` : undefined}
            size="lg"
            className="mt-1"
          />
        </div>
      </Ticket>

      {order.status === "cotizado" ? (
        <QuoteResponse orderId={order.id} estimatedPrice={order.estimated_price} />
      ) : null}

      {order.status === "entregado" && !review ? <ReviewForm orderId={order.id} /> : null}

      {showStages && itemsWithStages.length > 0 ? (
        <section className="space-y-5">
          <SectionTitle
            size="lg"
            action={
              <p className="text-[15px] text-muted">
                {itemsWithStages.length} {itemsWithStages.length === 1 ? "servicio" : "servicios"} ·{" "}
                {doneStages} de {totalStages} etapas terminadas
              </p>
            }
          >
            ¿En qué va tu coche?
          </SectionTitle>

          {formattedItems.map((item) =>
            item.stages.length > 0 ? (
              <article key={item.id} className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground sm:text-[22px]">{item.title}</h3>
                    {item.materialLabel ? (
                      <p className="mt-1 text-[15px] text-muted">{item.materialLabel}</p>
                    ) : null}
                  </div>
                  {item.price !== null ? (
                    <p className="font-display text-2xl font-bold text-foreground">{money(item.price)}</p>
                  ) : null}
                </div>
                <div className="mt-7">
                  <StageStepper
                    stages={item.stages}
                    currentStageId={item.currentStageId}
                    completed={stagesCompleted}
                    currentSince={item.currentSince}
                  />
                </div>
              </article>
            ) : null,
          )}
        </section>
      ) : null}

      <div className="flex flex-wrap items-start gap-8">
        <div className="min-w-0 flex-[999_1_480px] space-y-8">
          <section className={cardClass}>
            <SectionTitle
              size="sm"
              action={!isFinalState ? <AddPhotoButton orderId={order.id} /> : null}
            >
              Fotos
            </SectionTitle>
            {photos && photos.length > 0 ? (
              <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
                {photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square overflow-hidden rounded-xl bg-seam"
                  >
                    <StorageImage src={photo.url} alt="" fill sizes="(min-width: 640px) 25vw, 33vw" className="object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[15px] text-muted">Aún no hay fotos en este pedido.</p>
            )}
          </section>

          <section className={cardClass}>
            <SectionTitle size="sm">Detalle</SectionTitle>
            {order.service_description ? (
              <p className="mt-3 break-words text-base leading-relaxed text-foreground/85">
                {order.service_description}
              </p>
            ) : null}

            <div className={`mt-5 ${seamClass}`} />
            <div className="mt-4 space-y-3">
              {formattedItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base text-foreground">{item.title}</p>
                    {item.materialLabel ? (
                      <p className="text-[15px] text-muted">{item.materialLabel}</p>
                    ) : null}
                  </div>
                  {item.price !== null ? (
                    <p className="shrink-0 text-base text-foreground">{money(item.price)}</p>
                  ) : null}
                </div>
              ))}
              {total ? (
                <div className="flex items-baseline justify-between gap-4 pt-1">
                  <span className="text-base font-semibold text-foreground">
                    {order.status === "entregado" ? "Precio final" : "Total estimado"}
                  </span>
                  <span className="font-display text-3xl font-bold text-foreground">{money(total)}</span>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {order.estimated_price !== null ? (
                <DownloadPdfButton
                  orderId={order.id}
                  label={order.status === "entregado" ? "Descargar recibo" : "Descargar cotización"}
                />
              ) : null}
              <RepeatOrderButton orderId={order.id} />
            </div>
          </section>

          {review ? (
            <section className={cardClass}>
              <SectionTitle size="sm">Tu reseña</SectionTitle>
              <div className="mt-3 flex gap-0.5 text-2xl" aria-label={`${review.rating} de 5 estrellas`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    aria-hidden="true"
                    className={star <= review.rating ? "text-brand-yellow" : "text-seam"}
                  >
                    ★
                  </span>
                ))}
              </div>
              {review.comment ? (
                <p className="mt-2 break-words text-base text-foreground/85">{review.comment}</p>
              ) : null}
            </section>
          ) : null}

          {order.status === "entregado" ? <ComplaintForm orderId={order.id} /> : null}
        </div>

        <div className="min-w-0 flex-[1_1_320px] space-y-6">
          <section className={cardClass}>
            <SectionTitle size="sm">Bitácora</SectionTitle>
            <div className="mt-5">
              {history && history.length > 0 ? (
                <OrderTimeline
                  history={history}
                  profiles={historyProfiles ?? []}
                  currentUserId={user?.id ?? null}
                />
              ) : (
                <p className="text-[15px] text-muted">Sin actualizaciones todavía.</p>
              )}
            </div>
          </section>

          <section className={cardClass}>
            <p className={eyebrowClass}>Compartir</p>
            <p className="mt-2 text-[15px] text-muted">
              Manda un enlace para que alguien más vea cómo va tu coche, sin iniciar sesión.
            </p>
            <div className="mt-3">
              <ShareTrackingButton orderId={order.id} existingToken={order.share_token} />
            </div>
          </section>

          {isApprovedOrLater && !isFinalState ? (
            <section className="rounded-2xl border-2 border-dashed border-brand-yellow-dark/50 p-5 sm:p-6 dark:border-brand-yellow/40">
              <p className="text-base font-semibold text-foreground">¿Quieres agregar otro servicio?</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-foreground/80">
                Tu cotización ya está aprobada. Visítanos en el taller o escríbenos y lo sumamos a
                este pedido.
              </p>
              <div className="mt-3">
                <WhatsAppLink href={whatsappHref} label="Escribir por WhatsApp" />
              </div>
            </section>
          ) : null}

          <details className="group rounded-2xl px-1">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-[15px] text-muted underline underline-offset-4 hover:text-foreground">
              Más opciones del pedido
            </summary>
            <div className="mt-2 rounded-2xl border-2 border-dashed border-brand-red/30 p-4">
              <DeleteOrderButton orderId={order.id} redirectTo="/portal/pedidos" />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
