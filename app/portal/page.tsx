import { createClient } from "@/lib/supabase/server";
import { Award, PlusCircle, Tag, Wrench } from "lucide-react";
import Link from "next/link";
import { OrderCard } from "@/components/portal/OrderCard";

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

export default async function PortalDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: orders }, { data: points }, { data: settings }] =
    await Promise.all([
      user
        ? supabase.from("profiles").select("full_name").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
      user
        ? supabase
            .from("orders")
            .select(
              "id, vehicle_make, vehicle_model, status, created_at, deleted_at, estimated_price, updated_at, client_last_viewed_at",
            )
            .eq("client_id", user.id)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      user
        ? supabase.from("loyalty_points").select("balance").eq("client_id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("loyalty_settings")
        .select("points_for_reward")
        .eq("id", 1)
        .single(),
    ]);

  const activeOrders = orders?.filter(
    (o) => !["entregado", "cancelado", "rechazado"].includes(o.status),
  );

  const enProceso = activeOrders?.filter((o) => o.status === "en_proceso").length ?? 0;
  const listos = activeOrders?.filter((o) => o.status === "listo_para_entrega").length ?? 0;

  let activeCouponsCount = 0;
  if (user) {
    const { count } = await supabase
      .from("coupons")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .or(`client_id.is.null,client_id.eq.${user.id}`);
    activeCouponsCount = count ?? 0;
  }

  const balance = points?.balance ?? 0;
  const goal = settings?.points_for_reward ?? 500;
  const pointsProgress = Math.min((balance / goal) * 100, 100);

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Hola{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="mt-1 text-sm text-muted">
            Aquí está el resumen de tus pedidos.
          </p>
        </div>
        <Link
          href="/portal/nuevo-pedido"
          className="flex items-center gap-1.5 rounded-md bg-brand-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
        >
          <PlusCircle size={16} /> Nuevo pedido
        </Link>
      </div>

      {/* Barra de métricas compacta */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-black/10 bg-surface p-3 text-center dark:border-white/10">
          <p className="text-xl font-bold text-foreground">{activeOrders?.length ?? 0}</p>
          <p className="text-[11px] text-muted">Activos</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-surface p-3 text-center dark:border-white/10">
          <p className="text-xl font-bold text-foreground">{enProceso}</p>
          <p className="text-[11px] text-muted">En proceso</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-surface p-3 text-center dark:border-white/10">
          <p className="text-xl font-bold text-foreground">{listos}</p>
          <p className="text-[11px] text-muted">Listos</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Columna principal: pedidos */}
        <div className="min-w-0">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Mis pedidos</h2>

          {!activeOrders || activeOrders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
              <p className="text-muted">Aún no tienes pedidos activos.</p>
              <Link
                href="/portal/nuevo-pedido"
                className="mt-4 inline-block text-sm font-medium text-brand-yellow-dark hover:underline dark:text-brand-yellow"
              >
                Solicita tu primera cotización
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  statusLabel={statusLabels[order.status] ?? order.status}
                />
              ))}
            </div>
          )}
        </div>

        {/* Barra lateral: accesos rápidos */}
        <div className="space-y-4">
          <Link
            href="/portal/puntos"
            className="block rounded-lg border border-black/10 bg-surface p-4 transition hover:border-brand-yellow-dark dark:border-white/10 dark:hover:border-brand-yellow"
          >
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Award size={13} /> PUNTOS
            </div>
            <p className="text-xl font-bold text-foreground">{balance}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
              <div
                className="h-full bg-brand-yellow"
                style={{ width: `${pointsProgress}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted">
              {balance}/{goal} para tu recompensa
            </p>
          </Link>

          <Link
            href="/portal/cupones"
            className="block rounded-lg border border-black/10 bg-surface p-4 transition hover:border-brand-yellow-dark dark:border-white/10 dark:hover:border-brand-yellow"
          >
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Tag size={13} /> CUPONES
            </div>
            <p className="text-xl font-bold text-foreground">{activeCouponsCount}</p>
            <p className="mt-1 text-[11px] text-muted">disponibles para ti</p>
          </Link>

          <div className="rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Wrench size={13} /> ACCESOS RÁPIDOS
            </div>
            <div className="space-y-1.5">
              <Link
                href="/portal/pedidos"
                className="block rounded-md px-2.5 py-1.5 text-sm text-foreground transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                Historial completo
              </Link>
              <Link
                href="/portal/mis-citas"
                className="block rounded-md px-2.5 py-1.5 text-sm text-foreground transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                Mis citas
              </Link>
              <Link
                href="/portal/perfil"
                className="block rounded-md px-2.5 py-1.5 text-sm text-foreground transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                Mi perfil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}