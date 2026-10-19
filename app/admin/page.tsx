import { QuoteReminderButton } from "@/components/admin/QuoteReminderButton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  SectionTitle,
  StageBar,
  StatusTag,
  buttonClass,
  cardClass,
  displayClass,
} from "@/components/taller";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, History } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MERIDA = "America/Merida";

function daysSince(value: string) {
  return Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24));
}

function ago(value: string) {
  const mins = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (mins < 60) return `hace ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "ayer" : `hace ${days} días`;
}

function vehicleOf(o: { vehicle_make: string | null; vehicle_model: string | null; vehicle_year?: number | null }) {
  return [o.vehicle_make, o.vehicle_model, o.vehicle_year].filter(Boolean).join(" ") || "Sin vehículo";
}

interface ShopItem {
  id: string;
  service_id: string | null;
  current_stage_id: string | null;
  order: number;
  services: { title: string } | null;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: MERIDA }).format(new Date());

  const [
    { count: pendientesCount },
    { count: cotizadosCount },
    { count: enProcesoCount },
    { count: listosCount },
    { data: deliveredThisMonth },
    { data: attentionOrders },
    { data: openComplaints },
    { data: todayAppointments },
    { data: shopOrders },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pendiente_revision").is("deleted_at", null),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "cotizado").is("deleted_at", null),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "en_proceso").is("deleted_at", null),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "listo_para_entrega").is("deleted_at", null),
    supabase
      .from("orders")
      .select("final_price")
      .eq("status", "entregado")
      .is("deleted_at", null)
      .not("delivered_at", "is", null)
      .gte("delivered_at", startOfMonth.toISOString()),
    supabase
      .from("orders")
      .select(
        "id, vehicle_make, vehicle_model, vehicle_year, status, created_at, updated_at, service_description, profiles!orders_client_id_fkey(full_name)",
      )
      .in("status", ["pendiente_revision", "cotizado"])
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(8),
    supabase
      .from("complaints")
      .select("id, description, created_at, order_id, profiles!complaints_client_id_fkey(full_name)")
      .eq("status", "abierta")
      .order("created_at", { ascending: true })
      .limit(5),
    supabase
      .from("appointments")
      .select("id, client_name, appointment_time, status, reason")
      .eq("appointment_date", today)
      .neq("status", "cancelada")
      .order("appointment_time", { ascending: true }),
    supabase
      .from("orders")
      .select(
        "id, vehicle_make, vehicle_model, vehicle_year, status, created_at, order_items(id, service_id, current_stage_id, order, services(title))",
      )
      .in("status", ["aprobado", "en_proceso", "listo_para_entrega"])
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(9),
    supabase
      .from("audit_log")
      .select("id, actor_name, action, entity_type, entity_label, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const monthlyRevenue =
    deliveredThisMonth?.reduce((sum, o) => sum + (o.final_price ?? 0), 0) ?? 0;

  // Etapas de los coches que están en el taller
  const items = (shopOrders ?? []).flatMap((o) => (o.order_items ?? []) as unknown as ShopItem[]);
  const serviceIds = [...new Set(items.map((i) => i.service_id).filter((s): s is string => Boolean(s)))];
  const { data: stagesData } = serviceIds.length
    ? await supabase
        .from("service_stages")
        .select("id, service_id, name, order, is_active")
        .in("service_id", serviceIds)
        .order("order", { ascending: true })
    : { data: [] };
  const stages = stagesData ?? [];

  function mainProgress(orderItems: ShopItem[]) {
    const sorted = [...orderItems].sort((a, b) => a.order - b.order);
    // El primer servicio que no ha terminado es el que "manda"
    for (const item of sorted) {
      const list = stages.filter(
        (s) => s.service_id === item.service_id && (s.is_active || s.id === item.current_stage_id),
      );
      if (list.length === 0) continue;
      const idx = list.findIndex((s) => s.id === item.current_stage_id);
      return {
        service: item.services?.title ?? "Servicio",
        stage: idx === -1 ? null : list[idx].name,
        idx,
        total: list.length,
      };
    }
    return null;
  }

  const monthName = new Date().toLocaleDateString("es-MX", { month: "long", timeZone: MERIDA });
  const todayLabel = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: MERIDA,
  });

  const counters = [
    { label: "Por revisar", value: pendientesCount ?? 0, href: "/admin/pedidos?status=pendiente_revision", hot: true },
    { label: "Cotizados", value: cotizadosCount ?? 0, href: "/admin/pedidos?status=cotizado" },
    { label: "En proceso", value: enProcesoCount ?? 0, href: "/admin/pedidos?status=en_proceso" },
    { label: "Listos para entrega", value: listosCount ?? 0, href: "/admin/pedidos?status=listo_para_entrega" },
  ];

  const attention = attentionOrders ?? [];
  const complaints = openComplaints ?? [];

  return (
    <div className="space-y-9">
      <header>
        <p className="text-[15px] capitalize text-muted">{todayLabel}</p>
        <h1 className={`${displayClass} mt-1.5 text-5xl text-foreground sm:text-6xl`}>
          Tablero del taller
        </h1>
      </header>

      {/* Pizarrón */}
      <section
        aria-label="Pedidos por estado"
        className="grid grid-cols-2 overflow-hidden rounded-[18px] bg-ink text-on-ink sm:grid-cols-5 dark:ring-1 dark:ring-white/10"
      >
        {counters.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="px-5 py-5 transition hover:bg-white/5 sm:border-r-2 sm:border-dashed sm:border-brand-yellow/35 sm:px-6 sm:py-6"
          >
            <p
              className={`font-display text-5xl font-extrabold leading-none sm:text-[56px] ${
                c.hot && c.value > 0 ? "text-brand-yellow" : ""
              }`}
            >
              {c.value}
            </p>
            <p className="mt-1.5 text-sm text-[#d9d5cc]">{c.label}</p>
          </Link>
        ))}
        <div className="col-span-2 border-t-2 border-dashed border-brand-yellow/35 px-5 py-5 sm:col-span-1 sm:border-t-0 sm:px-6 sm:py-6">
          <p className="font-display text-[34px] font-extrabold leading-none sm:mt-2">
            ${monthlyRevenue.toLocaleString("es-MX")}
          </p>
          <p className="mt-1.5 text-sm capitalize text-[#d9d5cc]">Entregado en {monthName}</p>
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-7">
        {/* Requiere atención */}
        <section className="min-w-0 flex-[999_1_460px] space-y-3.5">
          <SectionTitle>Requiere atención</SectionTitle>
          {attention.length === 0 && complaints.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Todo al día"
              description="No hay pedidos por revisar ni quejas abiertas."
            />
          ) : (
            <div className={`${cardClass} !py-1.5`}>
              {attention.map((o, i) => {
                const client = (o.profiles as unknown as { full_name: string } | null)?.full_name;
                const waiting = daysSince(o.status === "cotizado" ? o.updated_at ?? o.created_at : o.created_at);
                const isLast = i === attention.length - 1 && complaints.length === 0;
                return (
                  <div
                    key={o.id}
                    className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 ${
                      isLast ? "" : "border-b-2 border-dashed border-seam"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[17px] font-semibold text-foreground">
                        {vehicleOf(o)}
                        {client ? <span className="font-medium text-foreground/75"> · {client}</span> : null}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                        <StatusTag status={o.status} />
                        <span>
                          {o.status === "cotizado" ? "Esperando respuesta del cliente · " : ""}
                          {ago(o.status === "cotizado" ? o.updated_at ?? o.created_at : o.created_at)}
                        </span>
                        {waiting >= 2 ? (
                          <span className="font-semibold text-brand-red-dark dark:text-brand-red">
                            · {waiting} días
                          </span>
                        ) : null}
                      </p>
                    </div>
                    {o.status === "pendiente_revision" ? (
                      <Link href={`/admin/pedidos/${o.id}`} className={buttonClass("primary")}>
                        Cotizar
                      </Link>
                    ) : (
                      <div className="flex flex-wrap items-start gap-2">
                        <QuoteReminderButton orderId={o.id} size="sm" />
                        <Link href={`/admin/pedidos/${o.id}`} className={buttonClass("ghost")}>
                          Ver
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
              {complaints.map((c, i) => {
                const client = (c.profiles as unknown as { full_name: string } | null)?.full_name;
                return (
                  <div
                    key={c.id}
                    className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 ${
                      i === complaints.length - 1 ? "" : "border-b-2 border-dashed border-seam"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-[17px] font-semibold text-foreground">
                        <span className="rounded-md bg-brand-red-dark px-2 py-1 font-display text-[13px] font-bold uppercase leading-none tracking-[0.1em] text-white">
                          Queja
                        </span>
                        {client ?? "Cliente"}
                      </p>
                      <p className="mt-1 line-clamp-1 text-sm text-muted">
                        {c.description} · {ago(c.created_at)}
                      </p>
                    </div>
                    <Link href={`/admin/quejas/${c.id}`} className={buttonClass("outline")}>
                      Atender
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Citas de hoy */}
        <section className="min-w-0 flex-[1_1_300px] space-y-3.5">
          <SectionTitle
            action={
              <Link href="/admin/citas" className="inline-flex min-h-11 items-center text-[15px] font-semibold text-foreground">
                Ver citas
              </Link>
            }
          >
            Citas de hoy
          </SectionTitle>
          <div className={`${cardClass} !py-1.5`}>
            {todayAppointments && todayAppointments.length > 0 ? (
              todayAppointments.map((a, i) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-4 py-4 ${
                    i === todayAppointments.length - 1 ? "" : "border-b-2 border-dashed border-seam"
                  }`}
                >
                  <p className="w-16 shrink-0 font-display text-[26px] font-extrabold leading-none text-foreground">
                    {a.appointment_time?.slice(0, 5)}
                  </p>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">{a.client_name}</p>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {a.reason || "Sin motivo"}
                      {a.status === "pendiente" ? " · por confirmar" : ""}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-[15px] text-muted">No hay citas para hoy.</p>
            )}
          </div>
        </section>
      </div>

      {/* En el taller */}
      {shopOrders && shopOrders.length > 0 ? (
        <section className="space-y-3.5">
          <SectionTitle
            action={
              <Link href="/admin/pedidos" className="inline-flex min-h-11 items-center text-[15px] font-semibold text-foreground">
                Ver todos los pedidos
              </Link>
            }
          >
            En el taller ahora
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shopOrders.map((o) => {
              const p = mainProgress((o.order_items ?? []) as unknown as ShopItem[]);
              const days = daysSince(o.created_at);
              const ready = o.status === "listo_para_entrega";
              return (
                <Link
                  key={o.id}
                  href={`/admin/pedidos/${o.id}`}
                  className="block rounded-2xl bg-surface p-5 transition hover:ring-2 hover:ring-foreground/80 dark:ring-1 dark:ring-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-code text-[13px] text-muted">{o.id.slice(0, 8).toUpperCase()}</p>
                    {ready ? <StatusTag status={o.status} /> : null}
                  </div>
                  <p className="mt-1 font-display text-[26px] font-extrabold uppercase leading-none text-foreground">
                    {vehicleOf(o)}
                  </p>
                  {p ? (
                    <>
                      <p className="mt-3 text-sm text-foreground/85">
                        {p.service} · <span className="font-semibold">{ready ? "Terminado" : p.stage ?? "Sin iniciar"}</span>
                      </p>
                      <StageBar total={p.total} currentIndex={p.idx} completed={ready} className="mt-2" />
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-muted">Sin etapas configuradas</p>
                  )}
                  <p className={`mt-2.5 text-[13px] ${days >= 7 && !ready ? "font-semibold text-brand-red-dark dark:text-brand-red" : "text-muted"}`}>
                    {days === 0 ? "Ingresó hoy" : `${days} ${days === 1 ? "día" : "días"} desde que ingresó`}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Bitácora */}
      <section className="space-y-3.5">
        <SectionTitle
          action={
            <Link href="/admin/historial" className="inline-flex min-h-11 items-center text-[15px] font-semibold text-foreground">
              Ver todo
            </Link>
          }
        >
          Bitácora del equipo
        </SectionTitle>
        {!recentActivity || recentActivity.length === 0 ? (
          <EmptyState
            icon={History}
            title="Sin actividad todavía"
            description="Los cambios que hagas tú o tu equipo van a aparecer aquí."
          />
        ) : (
          <div className={`${cardClass} !py-1.5`}>
            {recentActivity.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between gap-4 py-3.5 ${
                  i === recentActivity.length - 1 ? "" : "border-b-2 border-dashed border-seam"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[15px] text-foreground">
                    <span className="font-semibold">{entry.actor_name ?? "Sistema"}</span>{" "}
                    {entry.action.toLowerCase()}
                  </p>
                  <p className="truncate text-sm text-muted">
                    {entry.entity_type}: {entry.entity_label}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-muted">{ago(entry.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
