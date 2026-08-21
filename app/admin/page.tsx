import { AdminOrderRow } from "@/components/admin/AdminOrderRow";
import { createClient } from "@/lib/supabase/server";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  History,
  PackageCheck,
  Wrench,
} from "lucide-react";
import Link from "next/link";

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
      .gte("updated_at", startOfMonth.toISOString()),
    supabase
      .from("orders")
      .select(
        "id, vehicle_make, vehicle_model, status, created_at, deleted_at, profiles!orders_client_id_fkey(full_name)",
      )
      .in("status", ["pendiente_revision", "cotizado"])
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("audit_log")
      .select("id, actor_name, action, entity_type, entity_label, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const monthlyRevenue =
    deliveredThisMonth?.reduce((sum, o) => sum + (o.final_price ?? 0), 0) ?? 0;

  const formattedAttention =
    attentionOrders?.map((o) => ({
      id: o.id,
      vehicle_make: o.vehicle_make,
      vehicle_model: o.vehicle_model,
      status: o.status,
      created_at: o.created_at,
      deleted_at: o.deleted_at,
      client_name:
        (o.profiles as unknown as { full_name: string } | null)?.full_name ?? null,
    })) ?? [];

  const stats = [
    {
      label: "Pendientes de revisión",
      value: pendientesCount ?? 0,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Cotizados",
      value: cotizadosCount ?? 0,
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "En proceso",
      value: enProcesoCount ?? 0,
      icon: Wrench,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Listos para entrega",
      value: listosCount ?? 0,
      icon: PackageCheck,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">
          Panorama general del taller.
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10"
          >
            <div className="flex items-center gap-2">
              <stat.icon size={16} className={stat.color} />
              <p className="text-xs font-medium text-muted">{stat.label}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Ingresos del mes */}
      <div className="mb-8 flex items-center gap-3 rounded-lg border border-brand-yellow/30 bg-brand-yellow/10 p-4">
        <CheckCircle2 size={20} className="text-brand-yellow-dark dark:text-brand-yellow" />
        <div>
          <p className="text-sm text-muted">Ingresos de este mes (pedidos entregados)</p>
          <p className="text-xl font-bold text-foreground">
            ${monthlyRevenue.toLocaleString("es-MX")}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        {/* Necesita atención */}
        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Necesita tu atención
          </h2>

          {formattedAttention.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/15 bg-surface p-10 text-center dark:border-white/15">
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
        </div>

        {/* Actividad reciente */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Actividad reciente
            </h2>
            <Link
              href="/admin/historial"
              className="text-xs font-medium text-brand-yellow-dark hover:underline dark:text-brand-yellow"
            >
              Ver todo
            </Link>
          </div>

          {!recentActivity || recentActivity.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/15 bg-surface p-10 text-center dark:border-white/15">
              <p className="text-sm text-muted">Sin actividad todavía.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-2 rounded-lg border border-black/10 bg-surface p-3 dark:border-white/10"
                >
                  <History size={14} className="mt-0.5 shrink-0 text-muted" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{entry.actor_name ?? "Sistema"}</span>{" "}
                      · {entry.action.toLowerCase()}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {entry.entity_type}: {entry.entity_label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}