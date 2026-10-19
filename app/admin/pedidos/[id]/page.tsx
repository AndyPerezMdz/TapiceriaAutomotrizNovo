import { OrderStagesPanel } from "@/components/admin/OrderStagesPanel";
import { OrderStaffPanel } from "@/components/admin/OrderStaffPanel";
import { OrderTimeline } from "@/components/portal/OrderTimeline";
import { DeleteOrderButton } from "@/components/shared/DeleteOrderButton";
import { DownloadPdfButton } from "@/components/shared/DownloadPdfButton";
import { StaffComplaintForm } from "@/components/admin/ComplaintForm";
import { statusLabels } from "@/lib/validations/admin-order";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Phone } from "lucide-react";
import { SectionTitle, Stamp, Ticket, cardClass, displayClass, seamClass } from "@/components/taller";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminPedidoDetallePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myProfile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  const isAdmin = myProfile?.role === "admin";

  const [{ data: order }, { data: items }, { data: photos }, { data: history }] =
    await Promise.all([
      supabase
        .from("orders")
        .select(
          "*, profiles!orders_client_id_fkey(full_name, phone), coupons(title, discount_type, discount_value, service_id), deleted_at",
        )
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
          href="/admin/pedidos"
          className="mb-6 inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={18} /> Volver a pedidos
        </Link>
        <div className={`${cardClass} !py-12 text-center`}>
          <p className="font-display text-2xl font-bold uppercase text-foreground">Este pedido fue eliminado</p>
          <p className="mt-2 text-[15px] text-muted">
            Ya no se puede consultar la información de este pedido.
          </p>
        </div>
      </div>
    );
  }

  const client = order.profiles as unknown as {
    full_name: string;
    phone: string;
  } | null;

  const coupon = order.coupons as unknown as {
    title: string;
    discount_type: string;
    discount_value: number;
    service_id: string | null;
  } | null;

  const vehicle = [order.vehicle_make, order.vehicle_model, order.vehicle_year]
    .filter(Boolean)
    .join(" ");

  const formattedItems = (items ?? []).map((item) => {
    const service = item.services as unknown as { title: string } | null;
    const material = item.material_types as unknown as { name: string } | null;
    const color = item.material_colors as unknown as { name: string } | null;
    return {
      id: item.id,
      serviceTitle: service?.title ?? null,
      serviceId: item.service_id,
      currentStageId: item.current_stage_id as string | null,
      materialLabel:
        material?.name && color?.name
          ? `${material.name} · ${color.name}`
          : material?.name ?? null,
      price: (item.price as number | null) ?? null,
    };
  });

  const total = order.final_price ?? order.estimated_price;
  const daysInShop = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 86400000);
  const showDays = !["entregado", "cancelado", "rechazado"].includes(order.status);

  const eyebrow = "text-[13px] uppercase tracking-[0.14em] text-on-ink-muted";

  return (
    <div className="mx-auto max-w-6xl space-y-7 overflow-x-hidden">
      <Link
        href="/admin/pedidos"
        className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={18} /> Pedidos
      </Link>

      <Ticket
        className="!mt-2"
        stub={
          <div className="flex flex-wrap items-end justify-between gap-5">
            <dl className="flex flex-wrap gap-x-8 gap-y-4">
              <div>
                <dt className={eyebrow}>Cliente</dt>
                <dd className="mt-1 text-[17px] font-semibold">{client?.full_name ?? "Cliente"}</dd>
              </div>
              {client?.phone ? (
                <div>
                  <dt className={eyebrow}>Teléfono</dt>
                  <dd className="mt-1">
                    <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 text-[17px] font-medium text-on-ink hover:text-brand-yellow">
                      <Phone size={15} /> {client.phone}
                    </a>
                  </dd>
                </div>
              ) : null}
              {total ? (
                <div>
                  <dt className={eyebrow}>Total</dt>
                  <dd className="mt-0.5 font-display text-[26px] font-bold leading-none">
                    ${Number(total).toLocaleString("es-MX")}
                  </dd>
                </div>
              ) : null}
            </dl>
            {order.estimated_price !== null ? (
              <div className="[&_a]:!border-on-ink/40 [&_a]:!text-on-ink [&_button]:!border-on-ink/40 [&_button]:!text-on-ink">
                <DownloadPdfButton
                  orderId={order.id}
                  label={order.status === "entregado" ? "Recibo PDF" : "Cotización PDF"}
                />
              </div>
            ) : null}
          </div>
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="font-code text-[13px] text-on-ink-muted sm:text-sm">
              Folio {order.id.slice(0, 8).toUpperCase()} · ingresó{" "}
              {new Date(order.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
              {showDays ? ` · ${daysInShop} ${daysInShop === 1 ? "día" : "días"} en el taller` : ""}
            </p>
            <h1 className={`${displayClass} mt-2 text-[44px] sm:text-6xl`}>
              {vehicle || "Vehículo sin detalle"}
            </h1>
          </div>
          <Stamp label={statusLabels[order.status] ?? order.status} size="lg" className="mt-1" />
        </div>
      </Ticket>

      <div className="flex flex-wrap items-start gap-7">
        {/* Columna de trabajo */}
        <div className="min-w-0 flex-[999_1_480px] space-y-6">
          {order.status === "en_proceso" ? <OrderStagesPanel items={formattedItems} /> : null}

          <OrderStaffPanel
            orderId={order.id}
            currentStatus={order.status}
            items={formattedItems}
            isAdmin={isAdmin}
            clientPhone={client?.phone ?? null}
            clientName={client?.full_name ?? null}
            vehicleLabel={vehicle}
            coupon={coupon}
          />
        </div>

        {/* Columna lateral */}
        <div className="min-w-0 flex-[1_1_300px] space-y-6">
          <section className={cardClass}>
            <SectionTitle size="sm">Lo que pidió</SectionTitle>
            <div className="mt-4 space-y-3">
              {formattedItems.map((item, index) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground">
                      {formattedItems.length > 1 ? `${index + 1}. ` : ""}
                      {item.serviceTitle ?? "Servicio"}
                    </p>
                    {item.materialLabel ? (
                      <p className="text-sm text-muted">{item.materialLabel}</p>
                    ) : null}
                  </div>
                  {item.price !== null ? (
                    <p className="shrink-0 text-base text-foreground">${Number(item.price).toLocaleString("es-MX")}</p>
                  ) : null}
                </div>
              ))}
            </div>
            {order.service_description ? (
              <>
                <div className={`mt-4 ${seamClass}`} />
                <p className="mt-4 break-words text-[15px] leading-relaxed text-foreground/85">
                  {order.service_description}
                </p>
              </>
            ) : null}
            {photos && photos.length > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square overflow-hidden rounded-xl bg-seam"
                  >
                    <img src={photo.url} alt="" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            ) : null}
          </section>

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

          {order.status === "entregado" ? (
            <section className={cardClass}>
              <SectionTitle size="sm">Quejas</SectionTitle>
              <p className="mb-3 mt-2 text-[15px] text-muted">
                Si el cliente reportó un problema por WhatsApp (no desde la página), regístralo aquí.
              </p>
              <StaffComplaintForm orderId={order.id} />
            </section>
          ) : null}

          <section className="rounded-2xl border-2 border-dashed border-brand-red/35 p-5">
            <p className="text-[15px] font-semibold text-brand-red-dark dark:text-brand-red">Zona de cuidado</p>
            <p className="mb-3 mt-1 text-sm text-muted">
              Eliminar oculta el pedido al cliente. El historial se conserva.
            </p>
            <DeleteOrderButton orderId={order.id} redirectTo="/admin/pedidos" />
          </section>
        </div>
      </div>
    </div>
  );
}
