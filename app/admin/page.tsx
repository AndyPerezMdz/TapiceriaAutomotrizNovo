import { AdminOrderRow } from "@/components/admin/AdminOrderRow";
import { createClient } from "@/lib/supabase/server";
import {
  AlertTriangle,
  Award,
  Calendar,
  ClipboardList,
  DollarSign,
  History,
  PackageCheck,
  Star,
  Tag,
  Wrench,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    { count: pendientesCount },
    { count: cotizadosCount },
    { count: enProcesoCount },
    { count: listosCount },
    { data: deliveredThisMonth },
    { data: attentionOrders },
    { data: recentActivity },
    { count: pendingAppointments },
    { count: activeCouponsCount },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendiente_revision")
      .is("deleted_at", null),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "cotizado")
      .is("deleted_at", null),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "en_proceso")
      .is("deleted_at", null),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "listo_para_entrega")
      .is("deleted_at", null),
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
        "id, vehicle_make, vehicle_model, status, created_at, deleted_at, profiles!orders_client_id_fkey(full_name, avatar_url)",
      )
      .in("status", ["pendiente_revision", "cotizado"])
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(6),
    supabase
      .from("audit_log")
      .select("id, actor_name, action, entity_type, entity_label, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendiente"),
    supabase
      .from("coupons")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  const monthlyRevenue =
    deliveredThisMonth?.reduce((sum, o) => sum + (o.final_price ?? 0), 0) ?? 0;

  const formattedAttention =
    attentionOrders?.map((o) => {
      const client = o.profiles as unknown as {
        full_name: string;
        avatar_url: string | null;
      } | null;
      return {
        id: o.id,
        vehicle_make: o.vehicle_make,
        vehicle_model: o.vehicle_model,
        status: o.status,
        created_at: o.created_at,
        deleted_at: o.deleted_at,
        client_name: client?.full_name ?? null,
        client_avatar_url: client?.avatar_url ?? null,
      };
    }) ?? [];

  const stats = [
    { label: "Pendientes", value: pendientesCount ?? 0, icon: ClipboardList },
    { label: "Cotizados", value: cotizadosCount ?? 0, icon: DollarSign },
    { label: "En proceso", value: enProcesoCount ?? 0, icon: Wrench },
    { label: "Listos", value: listosCount ?? 0, icon: PackageCheck },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-2 text-base text-muted">
          Panorama general del taller.
        </p>
      </div>

      {/* Métricas */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-black/10 bg-surface p-5 text-center dark:border-white/10"
          >
            <stat.icon size={20} className="mx-auto mb-2 text-muted" />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.label}</p>
          </div>
        ))}
        <div className="col-span-2 rounded-xl border border-brand-yellow/30 bg-brand-yellow/10 p-5 text-center sm:col-span-1">
          <DollarSign size={20} className="mx-auto mb-2 text-brand-yellow-dark dark:text-brand-yellow" />
          <p className="text-2xl font-bold text-foreground">
            ${monthlyRevenue.toLocaleString("es-MX")}
          </p>
          <p className="mt-1 text-xs text-muted">Este mes</p>
        </div>
      </div>

      <div className="grid gap-10 xl:grid-cols-[1fr_300px]">
        {/* Columna principal */}
        <div className="min-w-0 space-y-10">
          <div>
            <h2 className="mb-4 text-base font-semibold text-foreground">
              Necesita tu atención
            </h2>

            {formattedAttention.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/15 bg-surface p-12 text-center dark:border-white/15">
                <p className="text-sm text-muted">No hay pedidos pendientes de revisión.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formattedAttention.map((order) => {
                  const daysWaiting = Math.floor(
                    (Date.now() - new Date(order.created_at).getTime()) /
                      (1000 * 60 * 60 * 24),
                  );
                  return (
                    <div key={order.id} className="relative">
                      {daysWaiting >= 2 ? (
                        <span className="absolute -right-2 -top-2 z-10 flex items-center gap-1 rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-semibold text-white">
                          <AlertTriangle size={10} /> {daysWaiting}d
                        </span>
                      ) : null}
                      <AdminOrderRow order={order} />
                    </div>
                  );
                })}
              </div>
            )}

            {formattedAttention.length > 0 ? (
              <Link
                href="/admin/pedidos"
                className="mt-4 inline-block text-sm font-medium text-brand-yellow-dark hover:underline dark:text-brand-yellow"
              >
                Ver todos los pedidos →
              </Link>
            ) : null}
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                Actividad reciente
              </h2>
              <Link
                href="/admin/historial"
                className="text-sm font-medium text-brand-yellow-dark hover:underline dark:text-brand-yellow"
              >
                Ver todo
              </Link>
            </div>

            {!recentActivity || recentActivity.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/15 bg-surface p-12 text-center dark:border-white/15">
                <p className="text-sm text-muted">Sin actividad todavía.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 rounded-xl border border-black/10 bg-surface p-4 dark:border-white/10"
                  >
                    <History size={16} className="mt-0.5 shrink-0 text-muted" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{entry.actor_name ?? "Sistema"}</span>{" "}
                        · {entry.action.toLowerCase()}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {entry.entity_type}: {entry.entity_label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Barra lateral */}
        <div className="space-y-4">
          <Link
            href="/admin/citas"
            className="block rounded-xl border border-black/10 bg-surface p-5 transition hover:border-brand-yellow-dark dark:border-white/10 dark:hover:border-brand-yellow"
          >
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Calendar size={14} /> Citas pendientes
            </div>
            <p className="text-2xl font-bold text-foreground">{pendingAppointments ?? 0}</p>
          </Link>

          <Link
            href="/admin/cupones"
            className="block rounded-xl border border-black/10 bg-surface p-5 transition hover:border-brand-yellow-dark dark:border-white/10 dark:hover:border-brand-yellow"
          >
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Tag size={14} /> Cupones activos
            </div>
            <p className="text-2xl font-bold text-foreground">{activeCouponsCount ?? 0}</p>
          </Link>

          <div className="rounded-xl border border-black/10 bg-surface p-5 dark:border-white/10">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Wrench size={14} /> Accesos rápidos
            </div>
            <div className="space-y-1">
              <Link
                href="/admin/servicios"
                className="block rounded-md px-3 py-2 text-sm text-foreground transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                Servicios
              </Link>
              <Link
                href="/admin/resenas"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                <Star size={14} /> Reseñas
              </Link>
              <Link
                href="/admin/puntos"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                <Award size={14} /> Puntos de lealtad
              </Link>
              <Link
                href="/admin/clientes"
                className="block rounded-md px-3 py-2 text-sm text-foreground transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                Clientes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}