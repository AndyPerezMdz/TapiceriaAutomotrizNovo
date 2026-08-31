import { ReferralLink } from "@/components/portal/ReferralLink";
import { createClient } from "@/lib/supabase/server";
import { Gift } from "lucide-react";

export default async function PortalReferidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: settings }, { data: myReferrals }] = await Promise.all([
    supabase
      .from("referral_settings")
      .select("reward_type, reward_value")
      .eq("id", 1)
      .single(),
    supabase
      .from("referral_rewards")
      .select("created_at, profiles!referral_rewards_referred_id_fkey(full_name)")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const rewardLabel =
    settings?.reward_type === "percentage"
      ? `${settings.reward_value}% de descuento`
      : `$${settings?.reward_value.toLocaleString("es-MX")} de descuento`;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
        Refiere y gana
      </h1>
      <p className="mb-6 text-sm text-muted">
        Por cada amigo que refieras y complete su primer pedido, ambos reciben{" "}
        {rewardLabel}.
      </p>

      <div className="mb-6">
        <ReferralLink userId={user.id} />
      </div>

      {myReferrals && myReferrals.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Personas que has referido
          </h2>
          <div className="space-y-2">
            {myReferrals.map((r, i) => {
              const referred = r.profiles as unknown as { full_name: string } | null;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md border border-black/10 bg-surface px-3 py-2.5 dark:border-white/10"
                >
                  <Gift size={16} className="shrink-0 text-brand-yellow-dark dark:text-brand-yellow" />
                  <div>
                    <p className="text-sm text-foreground">{referred?.full_name ?? "Cliente"}</p>
                    <p className="text-xs text-muted">
                      Completó su primer pedido — cupón entregado a ambos
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}