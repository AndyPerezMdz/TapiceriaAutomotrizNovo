import { LoyaltySettingsForm } from "@/components/admin/LoyaltySettingsForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPuntosPage() {
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

  const { data: settings } = await supabase
    .from("loyalty_settings")
    .select("pesos_per_point, points_for_reward, reward_type, reward_value")
    .eq("id", 1)
    .single();

  return (
    <div>
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl mb-8 text-foreground">
        Puntos de lealtad
      </h1>
      <LoyaltySettingsForm
        settings={
          settings ?? {
            pesos_per_point: 100,
            points_for_reward: 500,
            reward_type: "fixed",
            reward_value: 200,
          }
        }
      />
    </div>
  );
}