import { ActiveOrderTicket, type TicketService } from "@/components/portal/ActiveOrderTicket";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  SectionTitle,
  StatusTag,
  buttonClass,
  cardClass,
  displayClass,
  eyebrowClass,
} from "@/components/taller";
import { createClient } from "@/lib/supabase/server";
import { ChevronRight, FileText, Plus, PlusCircle } from "lucide-react";
import Link from "next/link";

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

interface OrderItemRow {
  id: string;
  service_id: string | null;
  current_stage_id: string | null;
  order: number;
  services: { title: string } | null;
}

export default async function PortalDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: profile },
    { data: orders },
    { data: nextAppointment },
    { data: points },
    { data: loyalty },
    { data: activeCoupon },
  ] = await Promise.all([
    user
      ? supabase.from("profiles").select("full_name").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("orders")
      .select(
        "id, vehicle_make, vehicle_model, vehicle_year, status, created_at, delivered_at, estimated_price, final_price, service_description, updated_at, client_last_viewed_at, order_items(id, service_id, current_stage_id, order, services(title))",
      )
      .eq("client_id", user?.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, status")
      .eq("client_id", user?.id)
      .in("status", ["pendiente", "confirmada"])
      .gte("appointment_date", today)
      .order("appointment_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("loyalty_points").select("balance").eq("client_id", user?.id).maybeSingle(),
    supabase.from("loyalty_settings").select("points_for_reward").eq("id", 1).maybeSingle(),
    supabase
      .from("active_coupons")
      .select("coupons(title, discount_type, discount_value)")
      .eq("client_id", user?.id)
      .maybeSingle(),
  ]);

  const allOrders = orders ?? [];
  const inShop = allOrders.filter((o) =>
    ["aprobado", "en_proceso", "listo_para_entrega"].includes(o.status),
  );
  const waitingQuote = allOrders.filter((o) => o.status === "cotizado");
  const inReview = allOrders.filter((o) => o.status === "pendiente_revision");
  const previous = allOrders.filter((o) => o.status === "entregado").slice(0, 3);

  // Etapas de los servicios de los pedidos que están en el taller
  const shopItems = inShop.flatMap((o) => (o.order_items ?? []) as unknown as OrderItemRow[]);
  const serviceIds = [
    ...new Set(shopItems.map((i) => i.service_id).filter((s): s is string => Boolean(s))),
  ];
  const { data: stagesData } = serviceIds.length
    ? await supabase
        .from("service_stages")
        .select("id, service_id, name, order, is_active")
        .in("service_id", serviceIds)
        .order("order", { ascending: true })
    : { data: [] };
  const stages = stagesData ?? [];

  function ticketServices(items: OrderItemRow[]): TicketService[] {
    return [...items]
      .sort((a, b) => a.order - b.order)
      .map((item) => {
        const list = stages.filter(
          (s) =>
            s.service_id === item.service_id && (s.is_active || s.id === item.current_stage_id),
        );
        const currentIndex = list.findIndex((s) => s.id === item.current_stage_id);
        return {
          id: item.id,
          title: item.services?.title ?? "Servicio",
          stageCount: list.length,
          currentIndex,
          currentName: currentIndex === -1 ? null : list[currentIndex].name,
        };
      })
      .filter((s) => s.stageCount > 0);
  }

  function vehicleOf(o: { vehicle_make: string | null; vehicle_model: string | null; vehicle_year?: number | null }) {
    return [o.vehicle_make, o.vehicle_model, o.vehicle_year].filter(Boolean).join(" ") || "Tu vehículo";
  }

  function hasUpdate(o: { updated_at: string | null; client_last_viewed_at: string | null }) {
    return Boolean(
      o.updated_at &&
        (!o.client_last_viewed_at || new Date(o.updated_at) > new Date(o.client_last_viewed_at)),
    );
  }

  const firstName = profile?.full_name?.split(" ")[0];
  const todayLabel = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const balance = points?.balance ?? 0;
  const goal = loyalty?.points_for_reward ?? 0;
  const progress = goal > 0 ? Math.min(100, Math.round((balance / goal) * 100)) : 0;

  const coupon = (activeCoupon?.coupons as unknown as {
    title: string;
    discount_type: string;
    discount_value: number;
  } | null) ?? null;
  const couponLabel = coupon
    ? coupon.discount_type === "percentage"
      ? `${coupon.discount_value}% menos`
      : `$${Number(coupon.discount_value).toLocaleString("es-MX")} menos`
    : null;

  const hasAnything = allOrders.some((o) => !["rechazado", "cancelado"].includes(o.status));

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[15px] capitalize text-muted">{todayLabel}</p>
          <h1 className={`${displayClass} mt-1.5 text-5xl text-foreground sm:text-[64px]`}>
            Hola{firstName ? `, ${firstName}` : ""}
          </h1>
        </div>
        <Link href="/portal/nuevo-pedido" className={`${buttonClass("ink", "lg")} hidden sm:inline-flex`}>
          <Plus size={18} strokeWidth={2.4} /> Nuevo pedido
        </Link>
      </header>

      {!hasAnything ? (
        <EmptyState
          icon={PlusCircle}
          title="Aún no has pedido nada"
          description="Cuando quieras renovar el interior de tu carro, tu primer pedido va a aparecer aquí."
          actionLabel="Solicitar mi primera cotización"
          actionHref="/portal/nuevo-pedido"
        />
      ) : (
        <>
          {waitingQuote.length > 0 ? (
            <section className="space-y-3">
              {waitingQuote.map((o) => (
                <article
                  key={o.id}
                  className={`${cardClass} flex flex-wrap items-center justify-between gap-5 !py-5`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-highlight text-foreground">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        Tu cotización está lista · {vehicleOf(o)}
                      </p>
                      <p className="mt-0.5 text-[15px] text-muted">
                        {o.estimated_price
                          ? `$${Number(o.estimated_price).toLocaleString("es-MX")} · `
                          : ""}
                        revísala para que empecemos
                      </p>
                    </div>
                  </div>
                  <Link href={`/portal/pedidos/${o.id}`} className={buttonClass("primary")}>
                    Revisar cotización
                  </Link>
                </article>
              ))}
            </section>
          ) : null}

          {inShop.length > 0 ? (
            <section className="space-y-4">
              <SectionTitle>En el taller ahora</SectionTitle>
              {inShop.map((o) => (
                <ActiveOrderTicket
                  key={o.id}
                  id={o.id}
                  vehicle={vehicleOf(o)}
                  createdAt={o.created_at}
                  statusLabel={statusLabels[o.status] ?? o.status}
                  completed={o.status === "listo_para_entrega"}
                  hasUpdate={hasUpdate(o)}
                  services={ticketServices((o.order_items ?? []) as unknown as OrderItemRow[])}
                />
              ))}
            </section>
          ) : null}

          {inReview.length > 0 ? (
            <section className="space-y-3">
              <SectionTitle size="sm">Estamos revisando</SectionTitle>
              <div className={`${cardClass} !py-2`}>
                {inReview.map((o, i) => (
                  <Link
                    key={o.id}
                    href={`/portal/pedidos/${o.id}`}
                    className={`flex min-h-[68px] items-center justify-between gap-4 ${
                      i < inReview.length - 1 ? "border-b-2 border-dashed border-seam" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[17px] font-semibold text-foreground">{vehicleOf(o)}</p>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        Te mandamos la cotización pronto
                      </p>
                    </div>
                    <StatusTag status={o.status} />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <section className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        <article className={cardClass}>
          <p className={eyebrowClass}>Próxima cita</p>
          {nextAppointment ? (
            <>
              <p className={`${displayClass} mt-2.5 text-[40px] text-foreground`}>
                {new Date(`${nextAppointment.appointment_date}T12:00:00`).toLocaleDateString(
                  "es-MX",
                  { weekday: "short", day: "numeric", month: "short" },
                )}
              </p>
              <p className="mt-1.5 text-[15px] text-muted">
                {nextAppointment.appointment_time?.slice(0, 5)}
                {nextAppointment.status === "pendiente" ? " · por confirmar" : ""}
              </p>
            </>
          ) : (
            <p className="mt-2.5 text-[15px] text-muted">No tienes citas próximas.</p>
          )}
          <Link href="/portal/mis-citas" className="mt-2 inline-flex min-h-11 items-center text-[15px] font-semibold text-foreground">
            {nextAppointment ? "Ver mis citas" : "Agendar una cita"}
          </Link>
        </article>

        <article className={cardClass}>
          <p className={eyebrowClass}>Tus puntos</p>
          <p className={`${displayClass} mt-2.5 text-[40px] text-foreground`}>
            {balance.toLocaleString("es-MX")}
          </p>
          {goal > 0 ? (
            <>
              <div className="mt-3 h-2 rounded-full bg-seam">
                <div className="h-2 rounded-full bg-foreground" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-[15px] text-muted">
                {balance >= goal
                  ? "Ya puedes canjear un cupón"
                  : `Te faltan ${(goal - balance).toLocaleString("es-MX")} para tu próximo cupón`}
              </p>
            </>
          ) : null}
          <Link href="/portal/puntos" className="mt-1 inline-flex min-h-11 items-center text-[15px] font-semibold text-foreground">
            Ver puntos
          </Link>
        </article>

        {couponLabel ? (
          <article className="relative overflow-hidden rounded-[18px] bg-brand-yellow p-5 text-ink sm:p-7">
            <span aria-hidden="true" className="absolute inset-2 rounded-xl border-2 border-dashed border-ink/35" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.14em] text-[#3d3200]">Cupón activo</p>
              <p className={`${displayClass} mt-2.5 text-[40px]`}>{couponLabel}</p>
              <p className="mt-1.5 text-[15px] text-[#2b2400]">{coupon?.title}</p>
              <Link href="/portal/cupones" className="mt-1 inline-flex min-h-11 items-center text-[15px] font-semibold">
                Ver cupones
              </Link>
            </div>
          </article>
        ) : (
          <article className="relative overflow-hidden rounded-[18px] border-2 border-dashed border-field-border p-5 sm:p-7">
            <p className={eyebrowClass}>Cupones</p>
            <p className="mt-2.5 text-[15px] text-muted">No tienes un cupón activo.</p>
            <Link href="/portal/cupones" className="mt-2 inline-flex min-h-11 items-center text-[15px] font-semibold text-foreground">
              Ver cupones disponibles
            </Link>
          </article>
        )}
      </section>

      {previous.length > 0 ? (
        <section className="space-y-3">
          <SectionTitle
            action={
              <Link href="/portal/pedidos" className="inline-flex min-h-11 items-center text-[15px] font-semibold text-foreground">
                Ver historial
              </Link>
            }
          >
            Pedidos anteriores
          </SectionTitle>
          <div className={`${cardClass} !py-2`}>
            {previous.map((o, i) => {
              const firstService = ((o.order_items ?? []) as unknown as OrderItemRow[])[0]?.services?.title;
              const delivered = o.delivered_at
                ? new Date(o.delivered_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })
                : null;
              return (
                <Link
                  key={o.id}
                  href={`/portal/pedidos/${o.id}`}
                  className={`flex min-h-[68px] items-center justify-between gap-4 ${
                    i < previous.length - 1 ? "border-b-2 border-dashed border-seam" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-[17px] font-semibold text-foreground">{vehicleOf(o)}</p>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {[firstService, delivered ? `entregado ${delivered}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-muted" />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
