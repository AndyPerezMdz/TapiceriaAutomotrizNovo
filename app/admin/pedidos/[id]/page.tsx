import { OrderStaffPanel } from "@/components/admin/OrderStaffPanel";
import { OrderTimeline } from "@/components/portal/OrderTimeline";
import { DeleteOrderButton } from "@/components/shared/DeleteOrderButton";
import { DownloadPdfButton } from "@/components/shared/DownloadPdfButton";
import { statusLabels } from "@/lib/validations/admin-order";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Calendar, Car } from "lucide-react";
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
          "id, price, service_id, services(title), material_types(name), material_colors(name, hex_color)",
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
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={16} /> Volver a pedidos
        </Link>
        <div className="rounded-lg border border-black/10 bg-surface p-10 text-center dark:border-white/10">
          <p className="font-medium text-foreground">Este pedido fue eliminado</p>
          <p className="mt-2 text-sm text-muted">
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
      materialLabel:
        material?.name && color?.name
          ? `${material.name} · ${color.name}`
          : material?.name ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-4xl overflow-x-hidden">
      <Link
        href="/admin/pedidos"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={16} /> Volver a pedidos
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {client?.full_name ?? "Cliente"}
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

      <div className="grid gap-8 sm:grid-cols-[1fr_1.1fr]">
        <div className="min-w-0 space-y-6">
          <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Car size={16} /> {vehicle || "Vehículo sin detalle"}
            </h2>

            <div className="space-y-2">
              {formattedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-md border border-black/10 px-3 py-2 dark:border-white/10"
                >
                  <p className="text-sm font-medium text-brand-yellow-dark dark:text-brand-yellow">
                    {formattedItems.length > 1 ? `${index + 1}. ` : ""}
                    {item.serviceTitle ?? "Servicio"}
                  </p>
                  {item.materialLabel ? (
                    <p className="text-xs text-muted">{item.materialLabel}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <p className="mt-3 break-words text-sm text-muted">
              {order.service_description}
            </p>

            {order.estimated_price !== null ? (
              <div className="mt-3">
                <DownloadPdfButton
                  orderId={order.id}
                  label={order.status === "entregado" ? "Descargar recibo" : "Descargar cotización"}
                />
              </div>
            ) : null}
          </div>

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
                    <img src={photo.url} alt="" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
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

          <DeleteOrderButton orderId={order.id} redirectTo="/admin/pedidos" />
        </div>

        <div className="min-w-0">
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
      </div>
    </div>
  );
}