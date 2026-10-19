import { ReferralSettingsForm } from "@/components/admin/ReferralSettingsForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminReferidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: myProfile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  if (myProfile?.role !== "admin") {
    redirect("/admin");
  }

  const [{ data: settings }, { data: rewards }] = await Promise.all([
    supabase
      .from("referral_settings")
      .select("reward_type, reward_value")
      .eq("id", 1)
      .single(),
    supabase
      .from("referral_rewards")
      .select(
        "created_at, profiles!referral_rewards_referrer_id_fkey(full_name), referred:profiles!referral_rewards_referred_id_fkey(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div>
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl mb-8 text-foreground">
        Programa de referidos
      </h1>

      <div className="mb-8">
        <ReferralSettingsForm
          settings={settings ?? { reward_type: "fixed", reward_value: 100 }}
        />
      </div>

      <h2 className="font-display text-2xl font-bold uppercase mb-3 text-foreground">
        Referidos completados ({rewards?.length ?? 0})
      </h2>
      {!rewards || rewards.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-field-border bg-surface p-10 text-center">
          <p className="text-[15px] text-muted">Nadie ha completado un referido todavía.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rewards.map((r, i) => {
            const referrer = r.profiles as unknown as { full_name: string } | null;
            const referred = r.referred as unknown as { full_name: string } | null;
            return (
              <div
                key={i}
                className="rounded-xl bg-surface px-3 py-2.5 text-[15px] dark:ring-1 dark:ring-white/5"
              >
                <span className="font-medium text-foreground">{referrer?.full_name}</span>{" "}
                <span className="text-muted">refirió a</span>{" "}
                <span className="font-medium text-foreground">{referred?.full_name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}