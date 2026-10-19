import { RedeemPointsButton } from "@/components/portal/RedeemPointsButton";
import { createClient } from "@/lib/supabase/server";

export default async function PortalPuntosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: points }, { data: settings }, { data: ledger }] = await Promise.all([
    supabase.from("loyalty_points").select("balance").eq("client_id", user.id).maybeSingle(),
    supabase
      .from("loyalty_settings")
      .select("points_for_reward, reward_type, reward_value")
      .eq("id", 1)
      .single(),
    supabase
      .from("loyalty_ledger")
      .select("points, type, created_at")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const balance = points?.balance ?? 0;
  const goal = settings?.points_for_reward ?? 500;
  const progress = Math.min((balance / goal) * 100, 100);
  const rewardLabel =
    settings?.reward_type === "percentage"
      ? `${settings.reward_value}% de descuento`
      : `$${settings?.reward_value.toLocaleString("es-MX")} de descuento`;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl mb-2 text-foreground">
        Mis puntos
      </h1>
      <p className="mb-6 text-[15px] text-muted">
        Gana puntos con cada pedido entregado y canjéalos por descuentos.
      </p>

      <div className="relative mb-8 overflow-hidden rounded-[20px] bg-ink px-6 py-7 text-on-ink sm:px-9 sm:py-8 dark:ring-1 dark:ring-white/10">
        <p className="font-display text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-yellow">
          Tus puntos
        </p>
        <p className="mt-2 font-display text-7xl font-extrabold leading-none text-brand-yellow">
          {balance.toLocaleString("es-MX")}
        </p>
        <div className="mt-6 border-t-2 border-dashed border-brand-yellow/50" />
        <div className="mt-5 flex gap-1.5" aria-hidden="true">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#3a3936]">
            <div className="h-full rounded-full bg-brand-yellow transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <p className="mt-2.5 text-[15px] text-[#d9d5cc]">
          {balance} de {goal} puntos para tu próxima recompensa · {rewardLabel}
        </p>
        <div className="mt-5">
          <RedeemPointsButton canRedeem={balance >= goal} />
        </div>
      </div>

      {ledger && ledger.length > 0 ? (
        <div>
          <h2 className="font-display text-2xl font-bold uppercase mb-3 text-foreground">Movimientos recientes</h2>
          <div className="space-y-2">
            {ledger.map((l, i) => (
              <div
                key={i}
                className="flex min-h-14 items-center justify-between rounded-xl bg-surface px-5 text-base dark:ring-1 dark:ring-white/5"
              >
                <span className="text-foreground">
                  {l.type === "ganado" ? "Puntos ganados" : "Puntos canjeados"}
                </span>
                <span className={`font-display text-xl font-bold ${l.type === "ganado" ? "text-foreground" : "text-brand-red-dark dark:text-brand-red"}`}>
                  {l.type === "ganado" ? "+" : ""}
                  {l.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}