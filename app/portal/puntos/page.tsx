import { RedeemPointsButton } from "@/components/portal/RedeemPointsButton";
import { createClient } from "@/lib/supabase/server";
import { Award } from "lucide-react";

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
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
        Mis puntos
      </h1>
      <p className="mb-6 text-sm text-muted">
        Gana puntos con cada pedido entregado y canjéalos por descuentos.
      </p>

      <div className="mb-6 rounded-lg border border-black/10 bg-surface p-6 text-center dark:border-white/10">
        <Award size={28} className="mx-auto mb-2 text-brand-yellow-dark dark:text-brand-yellow" />
        <p className="text-3xl font-bold text-foreground">{balance}</p>
        <p className="text-xs text-muted">puntos acumulados</p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
          <div
            className="h-full bg-brand-yellow transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          {balance} / {goal} puntos para tu próxima recompensa ({rewardLabel})
        </p>

        <div className="mt-4">
          <RedeemPointsButton canRedeem={balance >= goal} />
        </div>
      </div>

      {ledger && ledger.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Movimientos recientes</h2>
          <div className="space-y-2">
            {ledger.map((l, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-black/10 bg-surface px-3 py-2 text-sm dark:border-white/10"
              >
                <span className="text-foreground">
                  {l.type === "ganado" ? "Puntos ganados" : "Puntos canjeados"}
                </span>
                <span className={l.type === "ganado" ? "text-green-600 dark:text-green-400" : "text-brand-red"}>
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